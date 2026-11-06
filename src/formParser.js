/**
 * Google Form HTML Parser & Submitter Engine
 * Extracts form metadata, sections, and questions from FB_PUBLIC_LOAD_DATA_
 */

export function parseGoogleFormHtml(html, formUrl) {
  // 1. Extract Form Action URL
  let formActionUrl = null;
  const formIdMatch = formUrl.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
  if (formIdMatch) {
    const isE = formUrl.includes('/e/');
    formActionUrl = `https://docs.google.com/forms/d/${isE ? 'e/' : ''}${formIdMatch[1]}/formResponse`;
  }

  // 2. Extract fbzx token if present in HTML
  let fbzx = null;
  const fbzxMatch = html.match(/name="fbzx"\s+value="(-?\d+)"/) || html.match(/value="(-?\d+)"\s+name="fbzx"/);
  if (fbzxMatch) {
    fbzx = fbzxMatch[1];
  }

  // 3. Extract FB_PUBLIC_LOAD_DATA_ using resilient balanced bracket matching
  let loadDataStr = null;
  const marker = "FB_PUBLIC_LOAD_DATA_";
  const markerIdx = html.indexOf(marker);

  if (markerIdx !== -1) {
    const startBracket = html.indexOf('[', markerIdx);
    if (startBracket !== -1) {
      let depth = 0;
      let inString = false;
      let escapeNext = false;
      let quoteChar = null;

      for (let i = startBracket; i < html.length; i++) {
        const char = html[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (inString) {
          if (char === quoteChar) {
            inString = false;
          }
          continue;
        }

        if (char === '"' || char === "'") {
          inString = true;
          quoteChar = char;
          continue;
        }

        if (char === '[') {
          depth++;
        } else if (char === ']') {
          depth--;
          if (depth === 0) {
            loadDataStr = html.substring(startBracket, i + 1);
            break;
          }
        }
      }
    }
  }

  if (!loadDataStr) {
    // Fallback regex attempt
    const loadDataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);\s*(?:<\/script>|\n)/);
    if (loadDataMatch) {
      loadDataStr = loadDataMatch[1];
    }
  }

  if (!loadDataStr) {
    throw new Error("Không thể tìm thấy cấu trúc biểu mẫu (FB_PUBLIC_LOAD_DATA_). Hãy kiểm tra xem biểu mẫu có mở công khai không hay có yêu cầu đăng nhập Google.");
  }

  let loadData;
  try {
    loadData = JSON.parse(loadDataStr);
  } catch (err) {
    try {
      // Handle trailing commas or minor JSON variations
      const sanitized = loadDataStr.replace(/,(\s*[\],}])/g, '$1');
      loadData = JSON.parse(sanitized);
    } catch (err2) {
      throw new Error("Lỗi khi đọc dữ liệu cấu trúc biểu mẫu: " + err2.message);
    }
  }

  // Structure:
  // loadData[1][8]: Form title
  // loadData[1][0]: Form description
  // loadData[1][1]: Array of question/section items
  const formTitle = (loadData[1] && (loadData[1][8] || loadData[1][0])) || "Biểu mẫu Google Form";
  const formDescription = (loadData[1] && loadData[1][0]) || "";
  if (!fbzx && loadData[1] && loadData[1][14]) {
    fbzx = String(loadData[1][14]);
  }

  const rawItems = (loadData[1] && loadData[1][1]) || [];

  const sections = [];
  let currentSection = {
    index: 0,
    title: "Phần 1: Thông tin chung",
    description: "",
    questions: []
  };
  sections.push(currentSection);

  let pageCount = 1;

  for (const rawItem of rawItems) {
    const itemId = rawItem[0];
    const itemTitle = rawItem[1] || "";
    const itemDesc = rawItem[2] || "";
    const itemType = rawItem[3];
    const itemPayload = rawItem[4];

    // Check for Section Header / Page Break
    // Type 8 is page break in Google Forms
    if (itemType === 8) {
      pageCount++;
      currentSection = {
        index: sections.length,
        title: itemTitle || `Phần ${sections.length + 1}`,
        description: itemDesc || "",
        questions: []
      };
      sections.push(currentSection);
      continue;
    }

    // Skip informational non-question items (type 6: description only, 11: image, 12: video)
    if (!itemPayload || !Array.isArray(itemPayload) || itemPayload.length === 0) {
      continue;
    }

    const question = parseQuestionItem(rawItem);
    if (question) {
      currentSection.questions.push(question);
    }
  }

  // Remove empty sections if any
  const filteredSections = sections.filter((s, idx) => s.questions.length > 0 || idx === 0);

  return {
    title: formTitle,
    description: formDescription,
    actionUrl: formActionUrl,
    fbzx: fbzx || "",
    pageCount: pageCount,
    sections: filteredSections
  };
}

function parseQuestionItem(rawItem) {
  const itemId = rawItem[0];
  const itemTitle = rawItem[1] || "Câu hỏi không tên";
  const itemDesc = rawItem[2] || "";
  const itemType = rawItem[3];
  const itemPayload = rawItem[4];

  // Types:
  // 0: Short text
  // 1: Paragraph text
  // 2: Multiple Choice (Radio)
  // 3: Dropdown
  // 4: Checkboxes
  // 5: Linear Scale (e.g. 1-5)
  // 7: Grid (Radio Grid or Checkbox Grid)
  // 9: Date
  // 10: Time

  if (itemType === 7) {
    // Grid type question (Matrix)
    // itemPayload contains rows: each row has [entryId, null, required, [rowTitle]]
    const rows = [];
    let columns = [];
    const isCheckboxGrid = rawItem[4] && rawItem[4][0] && rawItem[4][0][11] === 1;

    for (const subItem of itemPayload) {
      const rowEntryId = subItem[0];
      const rowTitle = (subItem[3] && subItem[3][0]) || `Dòng ${rows.length + 1}`;
      const isRequired = subItem[2] === 1;
      
      // The options/columns are usually stored in subItem[1]
      if (subItem[1] && Array.isArray(subItem[1]) && columns.length === 0) {
        columns = subItem[1].map(col => (Array.isArray(col) ? col[0] : col));
      }

      rows.push({
        entryId: String(rowEntryId),
        title: rowTitle,
        required: isRequired
      });
    }

    return {
      id: itemId,
      title: itemTitle,
      description: itemDesc,
      type: isCheckboxGrid ? 'checkbox_grid' : 'radio_grid',
      typeName: isCheckboxGrid ? 'Lưới hộp kiểm (Checkbox Grid)' : 'Lưới trắc nghiệm (Radio Grid)',
      required: rows.some(r => r.required),
      rows: rows,
      columns: columns.map(c => String(c)),
      config: rows.map(r => ({
        entryId: r.entryId,
        rowTitle: r.title,
        weights: columns.map(c => ({
          label: String(c),
          weight: Math.round(100 / (columns.length || 1))
        }))
      }))
    };
  }

  // Single entry questions
  const primaryEntry = itemPayload[0];
  if (!primaryEntry) return null;

  const entryId = primaryEntry[0];
  if (!entryId) return null;

  const isRequired = primaryEntry[2] === 1;
  const rawOptions = primaryEntry[1] || [];

  let typeKey = 'text';
  let typeName = 'Văn bản ngắn (Short text)';
  const options = [];

  switch (itemType) {
    case 0:
      typeKey = 'text';
      typeName = 'Văn bản ngắn';
      break;
    case 1:
      typeKey = 'paragraph';
      typeName = 'Đoạn văn dài';
      break;
    case 2:
      typeKey = 'radio';
      typeName = 'Trắc nghiệm (1 đáp án)';
      if (Array.isArray(rawOptions)) {
        for (const opt of rawOptions) {
          const optLabel = Array.isArray(opt) ? opt[0] : String(opt);
          options.push(optLabel);
        }
      }
      break;
    case 3:
      typeKey = 'dropdown';
      typeName = 'Menu thả xuống (Dropdown)';
      if (Array.isArray(rawOptions)) {
        for (const opt of rawOptions) {
          const optLabel = Array.isArray(opt) ? opt[0] : String(opt);
          options.push(optLabel);
        }
      }
      break;
    case 4:
      typeKey = 'checkbox';
      typeName = 'Hộp kiểm (Nhiều đáp án)';
      if (Array.isArray(rawOptions)) {
        for (const opt of rawOptions) {
          const optLabel = Array.isArray(opt) ? opt[0] : String(opt);
          options.push(optLabel);
        }
      }
      break;
    case 5:
      typeKey = 'scale';
      typeName = 'Thang đo tuyến tính (Linear scale)';
      if (Array.isArray(rawOptions)) {
        for (const opt of rawOptions) {
          const optLabel = Array.isArray(opt) ? opt[0] : String(opt);
          options.push(optLabel);
        }
      }
      break;
    case 9:
      typeKey = 'date';
      typeName = 'Ngày (Date)';
      break;
    case 10:
      typeKey = 'time';
      typeName = 'Thời gian (Time)';
      break;
    default:
      typeKey = 'text';
      typeName = `Khác (Type ${itemType})`;
  }

  // Create default probability distribution
  const initialWeights = options.map((opt, i, arr) => ({
    label: opt,
    // Equal split initially
    weight: Math.round(100 / arr.length)
  }));

  // Ensure sum equals 100% for radio/dropdown/scale
  if (initialWeights.length > 0) {
    const currentSum = initialWeights.reduce((s, o) => s + o.weight, 0);
    const diff = 100 - currentSum;
    initialWeights[0].weight += diff;
  }

  return {
    id: itemId,
    entryId: String(entryId),
    title: itemTitle,
    description: itemDesc,
    type: typeKey,
    typeName: typeName,
    required: isRequired,
    options: options,
    weights: initialWeights,
    // For text types: customizable templates/presets
    textConfig: {
      mode: 'random_preset', // 'random_preset' | 'custom_pool' | 'random_vietnamese_name' | 'random_email' | 'random_phone' | 'random_number'
      customPool: [
        "Rất tốt và hài lòng với chất lượng dịch vụ",
        "Trải nghiệm tuyệt vời, nhân viên hỗ trợ nhiệt tình",
        "Sản phẩm đáp ứng đúng nhu cầu, giao hàng nhanh",
        "Khá ổn, giá cả hợp lý",
        "Cần cải thiện thêm về tốc độ phản hồi nhưng nhìn chung tốt"
      ],
      rangeMin: 18,
      rangeMax: 60
    },
    // For checkboxes: select range
    checkboxConfig: {
      minSelect: 1,
      maxSelect: Math.max(1, options.length),
      probabilities: options.map(opt => ({
        label: opt,
        chance: 50 // 50% chance this checkbox is selected
      }))
    }
  };
}
