/**
 * Submission Generator and Runner for Google Forms
 */

const VIETNAMESE_SURNAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const VIETNAMESE_MIDDLES = ["Văn", "Thị", "Minh", "Thanh", "Đình", "Hữu", "Đức", "Quang", "Ngọc", "Tuấn", "Anh", "Xuân", "Khánh", "Hoàng"];
const VIETNAMESE_FIRSTNAMES = ["An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Hải", "Hưng", "Huy", "Khoa", "Linh", "Mai", "Nam", "Phong", "Phúc", "Quân", "Sơn", "Tâm", "Thảo", "Trang", "Trung", "Tuấn", "Vy", "Yến", "Đạt", "Bảo", "Kiên", "Hiếu", "Thắng"];

const VIETNAMESE_FEEDBACKS = [
  "Dịch vụ rất tốt và nhân viên nhiệt tình, sẽ tiếp tục ủng hộ.",
  "Chất lượng sản phẩm đúng như kỳ vọng, thời gian phản hồi rất nhanh.",
  "Giao diện dễ sử dụng, trải nghiệm mượt mà không gặp lỗi.",
  "Cần bổ sung thêm một số tính năng mở rộng nhưng hiện tại đã rất ổn.",
  "Mức giá hợp lý so với các bên khác trên thị trường.",
  "Đánh giá 5 sao cho sự hỗ trợ chu đáo từ phía đội ngũ kỹ thuật.",
  "Tôi rất hài lòng và sẽ giới thiệu cho đồng nghiệp cùng sử dụng.",
  "Sản phẩm hoạt động ổn định, tài liệu hướng dẫn rõ ràng chi tiết.",
  "Nên tối ưu thêm trải nghiệm trên thiết bị di động.",
  "Rất ấn tượng với sự chuyên nghiệp và tốc độ xử lý yêu cầu."
];

export function generateRandomText(textConfig) {
  const mode = textConfig?.mode || 'random_preset';

  if (mode === 'random_vietnamese_name') {
    const s = VIETNAMESE_SURNAMES[Math.floor(Math.random() * VIETNAMESE_SURNAMES.length)];
    const m = VIETNAMESE_MIDDLES[Math.floor(Math.random() * VIETNAMESE_MIDDLES.length)];
    const f = VIETNAMESE_FIRSTNAMES[Math.floor(Math.random() * VIETNAMESE_FIRSTNAMES.length)];
    return `${s} ${m} ${f}`;
  }

  if (mode === 'random_email') {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let user = '';
    for (let i = 0; i < 8; i++) {
      user += chars[Math.floor(Math.random() * chars.length)];
    }
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${user}@${domain}`;
  }

  if (mode === 'random_phone') {
    const prefixes = ['090', '091', '098', '097', '086', '083', '038', '039', '077'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let suffix = '';
    for (let i = 0; i < 7; i++) {
      suffix += Math.floor(Math.random() * 10);
    }
    return `${prefix}${suffix}`;
  }

  if (mode === 'random_number') {
    const min = Number(textConfig.rangeMin ?? 18);
    const max = Number(textConfig.rangeMax ?? 65);
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  if (mode === 'custom_pool') {
    const pool = textConfig.customPool || [];
    if (pool.length > 0) {
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // Fallback / random_preset: pick from predefined feedback pool
  return VIETNAMESE_FEEDBACKS[Math.floor(Math.random() * VIETNAMESE_FEEDBACKS.length)];
}

export function pickWeightedOption(weights) {
  if (!weights || weights.length === 0) return null;
  const totalWeight = weights.reduce((sum, item) => sum + Math.max(0, Number(item.weight) || 0), 0);
  if (totalWeight <= 0) {
    return weights[Math.floor(Math.random() * weights.length)].label;
  }
  let randomVal = Math.random() * totalWeight;
  for (const item of weights) {
    const w = Math.max(0, Number(item.weight) || 0);
    if (randomVal < w) {
      return item.label;
    }
    randomVal -= w;
  }
  return weights[weights.length - 1].label;
}

export function pickCheckboxes(checkboxConfig, options) {
  if (!options || options.length === 0) return [];
  const probs = checkboxConfig?.probabilities || [];
  const minSelect = Math.min(options.length, Math.max(1, checkboxConfig?.minSelect ?? 1));
  const maxSelect = Math.max(minSelect, checkboxConfig?.maxSelect ?? options.length);

  const selected = [];
  for (const opt of options) {
    const cfg = probs.find(p => p.label === opt);
    const chance = cfg ? Number(cfg.chance) : 50;
    if (Math.random() * 100 < chance) {
      selected.push(opt);
    }
  }

  // Ensure minimum selection
  if (selected.length < minSelect) {
    const remaining = options.filter(o => !selected.includes(o));
    // Shuffle remaining and add up to minSelect
    const shuffled = remaining.sort(() => 0.5 - Math.random());
    while (selected.length < minSelect && shuffled.length > 0) {
      selected.push(shuffled.pop());
    }
  }

  // Cap at maxSelect
  if (selected.length > maxSelect) {
    return selected.slice(0, maxSelect);
  }

  return selected;
}

export function generateFormPayload(formData) {
  const payloadEntries = []; // array of [key, value]
  const answersSummary = [];

  for (const section of formData.sections || []) {
    for (const q of section.questions || []) {
      const entryId = q.entryId ? `entry.${q.entryId}` : null;

      switch (q.type) {
        case 'text':
        case 'paragraph': {
          const textVal = generateRandomText(q.textConfig);
          if (entryId) {
            payloadEntries.push([entryId, textVal]);
            answersSummary.push({ question: q.title, answer: textVal });
          }
          break;
        }

        case 'radio':
        case 'dropdown':
        case 'scale': {
          const chosen = pickWeightedOption(q.weights);
          if (entryId && chosen !== null) {
            payloadEntries.push([entryId, chosen]);
            answersSummary.push({ question: q.title, answer: chosen });
          }
          break;
        }

        case 'checkbox': {
          const chosenList = pickCheckboxes(q.checkboxConfig, q.options);
          if (entryId) {
            for (const val of chosenList) {
              payloadEntries.push([entryId, val]);
            }
            answersSummary.push({ question: q.title, answer: chosenList.join(", ") });
          }
          break;
        }

        case 'radio_grid': {
          for (const row of q.config || []) {
            const rowEntry = `entry.${row.entryId}`;
            const chosen = pickWeightedOption(row.weights);
            if (chosen !== null) {
              payloadEntries.push([rowEntry, chosen]);
              answersSummary.push({ question: `${q.title} [${row.rowTitle}]`, answer: chosen });
            }
          }
          break;
        }

        case 'checkbox_grid': {
          for (const row of q.config || []) {
            const rowEntry = `entry.${row.entryId}`;
            const chosen = pickWeightedOption(row.weights);
            if (chosen !== null) {
              payloadEntries.push([rowEntry, chosen]);
              answersSummary.push({ question: `${q.title} [${row.rowTitle}]`, answer: chosen });
            }
          }
          break;
        }

        case 'date': {
          // Format YYYY-MM-DD
          const d = new Date();
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const dateStr = `${year}-${month}-${day}`;
          if (entryId) {
            payloadEntries.push([entryId, dateStr]);
            answersSummary.push({ question: q.title, answer: dateStr });
          }
          break;
        }

        case 'time': {
          // Format HH:MM
          const hour = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0');
          const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
          const timeStr = `${hour}:${minute}`;
          if (entryId) {
            payloadEntries.push([entryId, timeStr]);
            answersSummary.push({ question: q.title, answer: timeStr });
          }
          break;
        }

        default:
          break;
      }
    }
  }

  // Construct URLSearchParams
  const params = new URLSearchParams();
  for (const [k, v] of payloadEntries) {
    params.append(k, v);
  }

  // Multi-page history logic
  const pageCount = Math.max(1, formData.pageCount || formData.sections?.length || 1);
  const pageHistoryArray = Array.from({ length: pageCount }, (_, i) => i);
  params.append('pageHistory', pageHistoryArray.join(','));

  // Standard Google Form hidden fields
  params.append('fvv', '1');
  if (formData.fbzx) {
    params.append('fbzx', formData.fbzx);
  }

  return {
    params,
    answersSummary
  };
}

export async function submitOneForm(actionUrl, params) {
  const startTime = Date.now();
  const response = await fetch(actionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    },
    body: params.toString()
  });

  const durationMs = Date.now() - startTime;
  const status = response.status;
  const text = await response.text();

  // In Google Forms, a successful response returns HTTP 200 and HTML contains confirmation message
  // ("Câu trả lời của bạn đã được ghi lại", "Your response has been recorded", or formResponse page)
  const isSuccess = status === 200 && (
    text.includes('freebirdFormviewerViewResponseConfirmationMessage') ||
    text.includes('ghi lại') ||
    text.includes('recorded') ||
    text.includes('formResponse')
  );

  return {
    ok: isSuccess,
    statusCode: status,
    durationMs,
    message: isSuccess ? 'Thành công (Đã ghi nhận câu trả lời)' : `Mã trạng thái ${status} (Cần kiểm tra câu hỏi bắt buộc hoặc giới hạn đăng nhập)`
  };
}
