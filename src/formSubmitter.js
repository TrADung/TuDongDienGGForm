/**
 * Submission Generator and Runner for Google Forms
 * Enhanced Natural Language Generation for Vietnamese Short & Long Texts
 */

const VIETNAMESE_SURNAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", 
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đào", "Đoàn", "Vương", "Trịnh", "Lương"
];

const VIETNAMESE_MIDDLES = [
  "Văn", "Thị", "Minh", "Thanh", "Đình", "Hữu", "Đức", "Quang", "Ngọc", "Tuấn", 
  "Anh", "Xuân", "Khánh", "Hoàng", "Gia", "Bảo", "Phương", "Hải", "Nhật", "Kim"
];

const VIETNAMESE_FIRSTNAMES = [
  "An", "Bình", "Cường", "Dũng", "Giang", "Hà", "Hải", "Hưng", "Huy", "Khoa", 
  "Linh", "Mai", "Nam", "Phong", "Phúc", "Quân", "Sơn", "Tâm", "Thảo", "Trang", 
  "Trung", "Tuấn", "Vy", "Yến", "Đạt", "Bảo", "Kiên", "Hiếu", "Thắng", "Trí", 
  "Loan", "Hương", "Huyền", "Quỳnh", "Nga", "Tú", "Khải", "Bách", "Phát", "Tùng"
];

const VIETNAMESE_CITIES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương", 
  "Đồng Nai", "Quảng Ninh", "Khánh Hòa", "Bà Rịa - Vũng Tàu", "Thừa Thiên Huế", 
  "Bắc Ninh", "Nam Định", "Thái Nguyên", "Lâm Đồng", "Nghệ An", "Thanh Hóa", "Hải Dương"
];

const VIETNAMESE_JOBS = [
  "Sinh viên", "Lập trình viên (Developer)", "Nhân viên văn phòng", "Chuyên viên Marketing",
  "Kế toán", "Kinh doanh tự do", "Giáo viên / Giảng viên", "Nhân viên kinh doanh (Sales)",
  "Thiết kế đồ họa (Designer)", "Quản lý dự án", "Bác sĩ / Dược sĩ", "Kỹ sư cơ khí",
  "Chuyên viên nhân sự (HR)", "Nghiên cứu sinh", "Content Creator"
];

const VIETNAMESE_UNIVERSITIES = [
  "Đại học Bách Khoa", "Đại học Quốc gia", "Đại học Kinh tế Quốc dân", "Đại học Ngoại thương",
  "Đại học FPT", "Học viện Ngân hàng", "Đại học Sư phạm", "Đại học Thương mại",
  "Học viện Bưu chính Viễn thông", "Đại học Y Hà Nội", "Đại học Tôn Đức Thắng",
  "Đại học Kinh tế TP.HCM", "Đại học Bách Khoa TP.HCM", "Đại học Mở"
];

// Openings for natural dynamic sentences
const DYNAMIC_OPENINGS = [
  "Theo trải nghiệm của tôi,",
  "Sau một thời gian trải nghiệm dịch vụ,",
  "Bản thân tôi nhận thấy",
  "Đánh giá một cách khách quan thì",
  "Nhìn chung,",
  "Cá nhân tôi cảm thấy",
  "Qua quá trình sử dụng,",
  "Tôi thực sự ấn tượng khi",
  "Dưới góc nhìn của người dùng,",
  "Từ lúc bắt đầu sử dụng đến nay,",
  "Ấn tượng ban đầu của tôi là",
  "Về tổng quan,",
  "Theo đánh giá từ phía tôi,",
  "Sau khi tìm hiểu và sử dụng,"
];

// Aspects / Subjects
const DYNAMIC_ASPECTS = [
  "chất lượng dịch vụ và phong cách phục vụ",
  "sản phẩm đáp ứng rất sát nhu cầu thực tế",
  "tính năng và giao diện rất trực quan",
  "đội ngũ hỗ trợ phản hồi nhiệt tình, chu đáo",
  "quy trình xử lý công việc nhanh gọn và chuyên nghiệp",
  "tốc độ vận hành ổn định và ít xảy ra lỗi",
  "mức chi phí và giá trị mang lại rất tương xứng",
  "trải nghiệm người dùng được tối ưu tốt",
  "nội dung và tài liệu hướng dẫn rất đầy đủ",
  "các chức năng hoạt động mượt mà",
  "các thao tác thực hiện rất đơn giản và tiện lợi",
  "sự tiếp thu ý kiến của khách hàng rất cầu thị"
];

// Evaluations
const DYNAMIC_EVALUATIONS = [
  "vượt ngoài mong đợi ban đầu của tôi.",
  "đem lại cảm giác rất yên tâm và thoải mái.",
  "giúp tôi tiết kiệm được rất nhiều thời gian.",
  "rất xứng đáng để gắn bó lâu dài.",
  "cho thấy sự đầu tư nghiêm túc của đơn vị.",
  "mang lại sự hài lòng cao.",
  "đáp ứng tốt các tiêu chí tôi đặt ra.",
  "tạo được sự tin tưởng lớn.",
  "đã có sự tiến bộ rõ rệt qua từng đợt cập nhật.",
  "rất phù hợp cho cả người mới bắt đầu."
];

// Constructive suggestions (for long paragraphs)
const DYNAMIC_SUGGESTIONS = [
  "Nếu có thể bổ sung thêm các tính năng mở rộng trong tương lai thì sẽ hoàn hảo hơn.",
  "Mong đơn vị tiếp tục duy trì và phát huy chất lượng như hiện tại.",
  "Nên tiếp tục tối ưu thêm giao diện trên ứng dụng di động để tiện lợi hơn.",
  "Tôi hy vọng sẽ có thêm nhiều chương trình ưu đãi hoặc tính năng mới trong thời gian tới.",
  "Sẽ tuyệt vời hơn nữa nếu thời gian giải đáp thắc mắc vào giờ cao điểm được rút ngắn thêm một chút.",
  "Nhìn chung không có điểm gì đáng phàn nàn, tôi hoàn toàn ủng hộ hướng phát triển này.",
  "Có thể cân nhắc tích hợp thêm hướng dẫn bằng video ngắn cho người mới.",
  "Rất mong ban tổ chức tiếp tục lắng nghe phản hồi để hoàn thiện sản phẩm hơn nữa."
];

// Closings / Wishes
const DYNAMIC_CLOSINGS = [
  "Chúc đơn vị ngày càng phát triển và thành công hơn nữa!",
  "Tôi chắc chắn sẽ giới thiệu cho bạn bè và đồng nghiệp cùng trải nghiệm.",
  "Rất cảm ơn sự hỗ trợ nhiệt tình của đội ngũ!",
  "Sẽ tiếp tục tin tưởng và đồng hành trong thời gian dài.",
  "Cảm ơn vì đã mang đến một trải nghiệm chất lượng.",
  "Đánh giá 5 sao cho những nỗ lực tuyệt vời của tập thể."
];

/**
 * Generates dynamic, natural, non-repeating sentences or paragraphs
 */
export function generateDynamicText(isParagraph = false) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const sentence1 = `${pick(DYNAMIC_OPENINGS)} ${pick(DYNAMIC_ASPECTS)} ${pick(DYNAMIC_EVALUATIONS)}`;

  if (!isParagraph) {
    // Short answer: 1 clean natural sentence
    return sentence1;
  }

  // Long answer / Paragraph: 3 to 4 combined sentences forming a cohesive review
  const sentence2 = pick(DYNAMIC_SUGGESTIONS);
  const sentence3 = pick(DYNAMIC_CLOSINGS);

  // Add occasional connective phrases
  return `${sentence1} ${sentence2} ${sentence3}`;
}

export function generateRandomText(textConfig) {
  const mode = textConfig?.mode || 'dynamic_sentence';

  if (mode === 'dynamic_paragraph') {
    return generateDynamicText(true);
  }

  if (mode === 'dynamic_sentence' || mode === 'random_preset') {
    return generateDynamicText(false);
  }

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

  if (mode === 'random_city') {
    return VIETNAMESE_CITIES[Math.floor(Math.random() * VIETNAMESE_CITIES.length)];
  }

  if (mode === 'random_job') {
    return VIETNAMESE_JOBS[Math.floor(Math.random() * VIETNAMESE_JOBS.length)];
  }

  if (mode === 'random_university') {
    return VIETNAMESE_UNIVERSITIES[Math.floor(Math.random() * VIETNAMESE_UNIVERSITIES.length)];
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

  return generateDynamicText(false);
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
          const isParagraph = q.type === 'paragraph';
          // If mode is not set or default, auto assign dynamic mode based on type
          if (!q.textConfig) q.textConfig = {};
          if (!q.textConfig.mode || q.textConfig.mode === 'random_preset') {
            q.textConfig.mode = isParagraph ? 'dynamic_paragraph' : 'dynamic_sentence';
          }
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
