import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGoogleFormHtml } from './src/formParser.js';
import { generateFormPayload, submitOneForm } from './src/formSubmitter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory active batch jobs
const activeJobs = new Map();

/**
 * Endpoint to parse a Google Form URL
 */
app.post('/api/parse', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Vui lòng cung cấp link Google Form hợp lệ.' });
  }

  try {
    let targetUrl = url.trim();

    // Check if shortened forms.gle URL, follow redirect
    const headRes = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });

    const finalUrl = headRes.url;
    const html = await headRes.text();

    const parsed = parseGoogleFormHtml(html, finalUrl);
    return res.json({
      success: true,
      originalUrl: url,
      resolvedUrl: finalUrl,
      formData: parsed
    });
  } catch (err) {
    console.error('Error parsing form:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Không thể đọc biểu mẫu. Hãy đảm bảo biểu mẫu mở công khai và không yêu cầu đăng nhập.'
    });
  }
});

/**
 * Endpoint for a single test submission
 */
app.post('/api/test-submit', async (req, res) => {
  const { formData } = req.body;
  if (!formData || !formData.actionUrl) {
    return res.status(400).json({ error: 'Thiếu thông tin biểu mẫu hoặc actionUrl.' });
  }

  try {
    const { params, answersSummary } = generateFormPayload(formData);
    const result = await submitOneForm(formData.actionUrl, params);

    return res.json({
      success: result.ok,
      result,
      answersSummary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi khi gửi thử biểu mẫu.'
    });
  }
});

/**
 * Start a batch auto-fill task
 */
app.post('/api/batch/start', (req, res) => {
  const { formData, totalCount = 10, minDelay = 600, maxDelay = 1500, concurrency = 1 } = req.body;

  if (!formData || !formData.actionUrl) {
    return res.status(400).json({ error: 'Dữ liệu biểu mẫu không hợp lệ.' });
  }

  const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const job = {
    id: jobId,
    formData,
    totalCount: Math.max(1, Math.min(5000, Number(totalCount) || 10)),
    minDelay: Math.max(100, Number(minDelay) || 600),
    maxDelay: Math.max(Number(minDelay) || 600, Number(maxDelay) || 1500),
    concurrency: Math.max(1, Math.min(5, Number(concurrency) || 1)),
    status: 'running', // running | paused | stopped | completed
    submittedCount: 0,
    successCount: 0,
    failedCount: 0,
    logs: [],
    distributionStats: {}, // Track frequency of each choice
    clients: new Set(),
    startTime: Date.now(),
    endTime: null
  };

  // Initialize stats tracking
  for (const s of formData.sections || []) {
    for (const q of s.questions || []) {
      job.distributionStats[q.title] = {};
      if (q.options) {
        for (const opt of q.options) {
          job.distributionStats[q.title][opt] = 0;
        }
      }
    }
  }

  activeJobs.set(jobId, job);

  // Start asynchronous batch executor
  runBatchJob(job);

  return res.json({
    success: true,
    jobId,
    totalCount: job.totalCount
  });
});

/**
 * SSE endpoint for live streaming job progress
 */
app.get('/api/batch/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Không tìm thấy tiến trình điền.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  job.clients.add(res);

  // Send initial snapshot
  res.write(`data: ${JSON.stringify(createJobSnapshot(job))}\n\n`);

  req.on('close', () => {
    job.clients.delete(res);
  });
});

/**
 * Pause batch job
 */
app.post('/api/batch/pause/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Không tìm thấy job.' });

  if (job.status === 'running') {
    job.status = 'paused';
    notifyClients(job, { type: 'status_changed', status: 'paused' });
  }
  return res.json({ success: true, status: job.status });
});

/**
 * Resume batch job
 */
app.post('/api/batch/resume/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Không tìm thấy job.' });

  if (job.status === 'paused') {
    job.status = 'running';
    notifyClients(job, { type: 'status_changed', status: 'running' });
  }
  return res.json({ success: true, status: job.status });
});

/**
 * Stop batch job
 */
app.post('/api/batch/stop/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (!job) return res.status(404).json({ error: 'Không tìm thấy job.' });

  job.status = 'stopped';
  job.endTime = Date.now();
  notifyClients(job, { type: 'status_changed', status: 'stopped' });
  return res.json({ success: true, status: job.status });
});

/**
 * Get sample form templates for quick start & demo
 */
app.get('/api/templates', (req, res) => {
  const sampleData = {
    title: "Khảo Sát Mức Độ Hài Lòng Khách Hàng (Mẫu Demo)",
    description: "Biểu mẫu khảo sát dịch vụ nhiều phần với các dạng câu hỏi phong phú và tỷ lệ chọn ngẫu nhiên tùy chỉnh.",
    actionUrl: "https://docs.google.com/forms/d/e/1FAIpQLScDemoFormId123456789/formResponse",
    fbzx: "-4581298492019401",
    pageCount: 3,
    sections: [
      {
        index: 0,
        title: "Phần 1: Thông tin người tham gia",
        description: "Thu thập thông tin cá nhân cơ bản",
        questions: [
          {
            id: 101,
            entryId: "1001",
            title: "Họ và tên của bạn",
            description: "Điền họ tên người làm khảo sát",
            type: "text",
            typeName: "Văn bản ngắn",
            required: true,
            textConfig: {
              mode: "random_vietnamese_name"
            }
          },
          {
            id: 102,
            entryId: "1002",
            title: "Email liên hệ",
            description: "Email nhận kết quả khảo sát",
            type: "text",
            typeName: "Văn bản ngắn",
            required: true,
            textConfig: {
              mode: "random_email"
            }
          },
          {
            id: 103,
            entryId: "1003",
            title: "Độ tuổi của bạn",
            type: "radio",
            typeName: "Trắc nghiệm (1 đáp án)",
            required: true,
            options: ["Dưới 18 tuổi", "18 - 25 tuổi", "26 - 35 tuổi", "36 - 50 tuổi", "Trên 50 tuổi"],
            weights: [
              { label: "Dưới 18 tuổi", weight: 5 },
              { label: "18 - 25 tuổi", weight: 45 },
              { label: "26 - 35 tuổi", weight: 35 },
              { label: "36 - 50 tuổi", weight: 12 },
              { label: "Trên 50 tuổi", weight: 3 }
            ]
          }
        ]
      },
      {
        index: 1,
        title: "Phần 2: Đánh giá chất lượng dịch vụ",
        description: "Khảo sát trải nghiệm sản phẩm và tính năng",
        questions: [
          {
            id: 201,
            entryId: "2001",
            title: "Mức độ hài lòng tổng quan",
            description: "Thang điểm từ 1 (Rất tệ) đến 5 (Tuyệt vời)",
            type: "scale",
            typeName: "Thang đo tuyến tính (Linear scale)",
            required: true,
            options: ["1", "2", "3", "4", "5"],
            weights: [
              { label: "1", weight: 2 },
              { label: "2", weight: 5 },
              { label: "3", weight: 15 },
              { label: "4", weight: 48 },
              { label: "5", weight: 30 }
            ]
          },
          {
            id: 202,
            entryId: "2002",
            title: "Bạn thường sử dụng tính năng nào nhất? (Có thể chọn nhiều)",
            type: "checkbox",
            typeName: "Hộp kiểm (Nhiều đáp án)",
            required: true,
            options: ["Báo cáo thời gian thực", "Tự động hóa tác vụ", "Bảo mật nâng cao", "Giao diện di động", "Hỗ trợ 24/7"],
            checkboxConfig: {
              minSelect: 1,
              maxSelect: 4,
              probabilities: [
                { label: "Báo cáo thời gian thực", chance: 75 },
                { label: "Tự động hóa tác vụ", chance: 85 },
                { label: "Bảo mật nâng cao", chance: 40 },
                { label: "Giao diện di động", chance: 60 },
                { label: "Hỗ trợ 24/7", chance: 35 }
              ]
            }
          },
          {
            id: 203,
            entryId: "2003",
            title: "Kênh thông tin bạn biết đến chúng tôi",
            type: "dropdown",
            typeName: "Menu thả xuống (Dropdown)",
            required: false,
            options: ["Mạng xã hội (Facebook, TikTok)", "Tìm kiếm Google", "Bạn bè giới thiệu", "Quảng cáo trực tuyến", "Sự kiện / Hội thảo"],
            weights: [
              { label: "Mạng xã hội (Facebook, TikTok)", weight: 40 },
              { label: "Tìm kiếm Google", weight: 30 },
              { label: "Bạn bè giới thiệu", weight: 20 },
              { label: "Quảng cáo trực tuyến", weight: 8 },
              { label: "Sự kiện / Hội thảo", weight: 2 }
            ]
          }
        ]
      },
      {
        index: 2,
        title: "Phần 3: Đóng góp ý kiến & Hoàn tất",
        description: "Ghi nhận ý kiến phát triển sản phẩm",
        questions: [
          {
            id: 301,
            entryId: "3001",
            title: "Ý kiến hoặc đề xuất cải tiến cho sản phẩm",
            type: "paragraph",
            typeName: "Đoạn văn dài",
            required: false,
            textConfig: {
              mode: "dynamic_paragraph"
            }
          }
        ]
      }
    ]
  };

  return res.json({ sample: sampleData });
});

/**
 * Worker to execute batch requests
 */
async function runBatchJob(job) {
  while (job.submittedCount < job.totalCount && job.status !== 'stopped') {
    if (job.status === 'paused') {
      await sleep(400);
      continue;
    }

    try {
      const { params, answersSummary } = generateFormPayload(job.formData);

      // Track distribution stats
      for (const item of answersSummary) {
        if (!job.distributionStats[item.question]) {
          job.distributionStats[item.question] = {};
        }
        const answers = item.answer.includes(', ') ? item.answer.split(', ') : [item.answer];
        for (const a of answers) {
          job.distributionStats[item.question][a] = (job.distributionStats[item.question][a] || 0) + 1;
        }
      }

      // Perform HTTP submission
      const subResult = await submitOneForm(job.formData.actionUrl, params);

      job.submittedCount++;
      if (subResult.ok) {
        job.successCount++;
      } else {
        job.failedCount++;
      }

      const logEntry = {
        index: job.submittedCount,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        ok: subResult.ok,
        status: subResult.statusCode,
        durationMs: subResult.durationMs,
        message: subResult.message,
        sampleAnswer: answersSummary.slice(0, 3).map(a => `${a.question}: ${a.answer}`).join(' | ')
      };

      job.logs.unshift(logEntry);
      if (job.logs.length > 100) {
        job.logs.pop();
      }

      // Notify connected clients
      notifyClients(job, {
        type: 'progress',
        data: createJobSnapshot(job),
        latestLog: logEntry
      });
    } catch (err) {
      job.submittedCount++;
      job.failedCount++;
      const logEntry = {
        index: job.submittedCount,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        ok: false,
        status: 500,
        durationMs: 0,
        message: err.message || 'Lỗi kết nối',
        sampleAnswer: '—'
      };
      job.logs.unshift(logEntry);

      notifyClients(job, {
        type: 'progress',
        data: createJobSnapshot(job),
        latestLog: logEntry
      });
    }

    // Delay with human-like jitter
    const delay = Math.floor(Math.random() * (job.maxDelay - job.minDelay + 1)) + job.minDelay;
    await sleep(delay);
  }

  if (job.status !== 'stopped') {
    job.status = 'completed';
    job.endTime = Date.now();
    notifyClients(job, {
      type: 'completed',
      data: createJobSnapshot(job)
    });
  }
}

function createJobSnapshot(job) {
  const elapsedSec = Math.floor(((job.endTime || Date.now()) - job.startTime) / 1000);
  const percent = job.totalCount > 0 ? Math.round((job.submittedCount / job.totalCount) * 100) : 0;
  const speed = elapsedSec > 0 ? (job.submittedCount / elapsedSec).toFixed(1) : '0.0';
  const remainingCount = Math.max(0, job.totalCount - job.submittedCount);
  const remainingSec = speed > 0 ? Math.round(remainingCount / Number(speed)) : 0;

  return {
    id: job.id,
    status: job.status,
    totalCount: job.totalCount,
    submittedCount: job.submittedCount,
    successCount: job.successCount,
    failedCount: job.failedCount,
    percent,
    elapsedSec,
    remainingSec,
    speed,
    distributionStats: job.distributionStats,
    recentLogs: job.logs.slice(0, 20)
  };
}

function notifyClients(job, payload) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of job.clients) {
    try {
      client.write(message);
    } catch (e) {
      job.clients.delete(client);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 FormFlow Auto - Google Form Auto-filler Engine`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
