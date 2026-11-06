/**
 * FormFlow Auto - Frontend Controller
 */

// Global State
let currentFormData = null;
let currentSectionIndex = 0;
let activeJobId = null;
let activeEventSource = null;
let isJobRunning = false;
let isJobPaused = false;
let allLogs = [];
let chartInstance = null;

// DOM Elements
const inputFormUrl = document.getElementById('input-form-url');
const btnParseForm = document.getElementById('btn-parse-form');
const btnParseText = document.getElementById('btn-parse-text');
const btnParseSpinner = document.getElementById('btn-parse-spinner');
const parseErrorAlert = document.getElementById('parse-error-alert');
const parseErrorText = document.getElementById('parse-error-text');

const formInfoSection = document.getElementById('form-info-section');
const formDisplayTitle = document.getElementById('form-display-title');
const formDisplayDesc = document.getElementById('form-display-desc');
const formPagesBadge = document.getElementById('form-pages-badge');
const sectionsTabBar = document.getElementById('sections-tab-bar');

const workspaceGrid = document.getElementById('workspace-grid');
const questionsListContainer = document.getElementById('questions-list-container');
const currentSectionQuestionCount = document.getElementById('current-section-question-count');

const btnLoadDemo = document.getElementById('btn-load-demo');
const btnOpenGuide = document.getElementById('btn-open-guide');
const btnCloseGuide = document.getElementById('btn-close-guide');
const guideModal = document.getElementById('guide-modal');
const btnAutoBalanceAll = document.getElementById('btn-auto-balance-all');
const btnSavePreset = document.getElementById('btn-save-preset');

// Preset Manager Elements
const btnOpenPresets = document.getElementById('btn-open-presets');
const badgePresetsCount = document.getElementById('badge-presets-count');
const savePresetModal = document.getElementById('save-preset-modal');
const btnCloseSavePreset = document.getElementById('btn-close-save-preset');
const btnCancelSavePreset = document.getElementById('btn-cancel-save-preset');
const btnConfirmSavePreset = document.getElementById('btn-confirm-save-preset');
const inputSavePresetName = document.getElementById('input-save-preset-name');
const saveModalFormTitle = document.getElementById('save-modal-form-title');
const saveModalQCount = document.getElementById('save-modal-q-count');
const saveModalRunsCount = document.getElementById('save-modal-runs-count');

const presetsManagerModal = document.getElementById('presets-manager-modal');
const btnClosePresetsManager = document.getElementById('btn-close-presets-manager');
const modalPresetsTotalBadge = document.getElementById('modal-presets-total-badge');
const inputSearchPresets = document.getElementById('input-search-presets');
const btnImportPresetsTrigger = document.getElementById('btn-import-presets-trigger');
const btnExportAllPresets = document.getElementById('btn-export-all-presets');
const inputImportPresetFile = document.getElementById('input-import-preset-file');
const presetsListContainer = document.getElementById('presets-list-container');
const btnClearAllPresets = document.getElementById('btn-clear-all-presets');

const FORMFLOW_PRESETS_KEY = 'formflow_presets_v2';

// Execution & Monitor Elements
const inputTotalCount = document.getElementById('input-total-count');
const inputMinDelay = document.getElementById('input-min-delay');
const inputMaxDelay = document.getElementById('input-max-delay');
const btnStartBatch = document.getElementById('btn-start-batch');
const btnTestSingle = document.getElementById('btn-test-single');
const btnPauseJob = document.getElementById('btn-pause-job');
const btnPauseText = document.getElementById('btn-pause-text');
const btnStopJob = document.getElementById('btn-stop-job');

const jobStatusPill = document.getElementById('job-status-pill');
const jobStatusText = document.getElementById('job-status-text');
const statProgressText = document.getElementById('stat-progress-text');
const statProgressBar = document.getElementById('stat-progress-bar');
const statSuccessCount = document.getElementById('stat-success-count');
const statFailedCount = document.getElementById('stat-failed-count');
const statSpeed = document.getElementById('stat-speed');
const statRemainingTime = document.getElementById('stat-remaining-time');

const selectChartQuestion = document.getElementById('select-chart-question');
const liveLogsContainer = document.getElementById('live-logs-container');
const btnExportLogs = document.getElementById('btn-export-logs');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initEventListeners();
  updatePresetsBadge();
});

function initEventListeners() {
  btnParseForm.addEventListener('click', handleParseForm);
  inputFormUrl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleParseForm();
  });

  btnLoadDemo.addEventListener('click', handleLoadDemo);
  btnOpenGuide.addEventListener('click', () => guideModal.classList.remove('hidden'));
  btnCloseGuide.addEventListener('click', () => guideModal.classList.add('hidden'));
  guideModal.addEventListener('click', (e) => {
    if (e.target === guideModal) guideModal.classList.add('hidden');
  });

  btnAutoBalanceAll.addEventListener('click', handleAutoBalanceAll);
  
  // Preset Manager Listeners
  btnSavePreset.addEventListener('click', openSavePresetModal);
  btnOpenPresets.addEventListener('click', openPresetsManagerModal);
  btnCloseSavePreset.addEventListener('click', closeSavePresetModal);
  btnCancelSavePreset.addEventListener('click', closeSavePresetModal);
  btnConfirmSavePreset.addEventListener('click', handleConfirmSavePreset);
  inputSavePresetName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConfirmSavePreset();
  });

  btnClosePresetsManager.addEventListener('click', closePresetsManagerModal);
  inputSearchPresets.addEventListener('input', (e) => renderPresetsList(e.target.value));
  btnImportPresetsTrigger.addEventListener('click', () => inputImportPresetFile.click());
  inputImportPresetFile.addEventListener('change', handleImportPresetsFile);
  btnExportAllPresets.addEventListener('click', handleExportAllPresets);
  btnClearAllPresets.addEventListener('click', handleClearAllPresets);

  // Close modals on outside click
  savePresetModal.addEventListener('click', (e) => {
    if (e.target === savePresetModal) closeSavePresetModal();
  });
  presetsManagerModal.addEventListener('click', (e) => {
    if (e.target === presetsManagerModal) closePresetsManagerModal();
  });

  btnTestSingle.addEventListener('click', handleTestSingle);
  btnStartBatch.addEventListener('click', handleStartBatch);
  btnPauseJob.addEventListener('click', handleTogglePause);
  btnStopJob.addEventListener('click', handleStopJob);

  selectChartQuestion.addEventListener('change', updateChartDisplay);
  btnExportLogs.addEventListener('click', handleExportLogs);
}

/**
 * Parse Google Form URL
 */
async function handleParseForm() {
  const url = inputFormUrl.value.trim();
  if (!url) {
    showError("Vui lòng nhập đường link Google Form (docs.google.com/forms hoặc forms.gle)");
    return;
  }

  hideError();
  setParseLoading(true);

  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Không thể phân tích biểu mẫu.');
    }

    loadFormDataIntoUI(data.formData);
  } catch (err) {
    showError(err.message || 'Lỗi khi tải biểu mẫu.');
  } finally {
    setParseLoading(false);
  }
}

/**
 * Load Demo Template
 */
async function handleLoadDemo() {
  hideError();
  setParseLoading(true);
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    if (data.sample) {
      inputFormUrl.value = data.sample.actionUrl;
      loadFormDataIntoUI(data.sample);
    }
  } catch (err) {
    showError("Không thể tải biểu mẫu mẫu.");
  } finally {
    setParseLoading(false);
  }
}

/**
 * Populate UI with Form Data
 */
function loadFormDataIntoUI(formData) {
  currentFormData = formData;
  currentSectionIndex = 0;

  formDisplayTitle.textContent = formData.title || "Biểu mẫu Google Form";
  formDisplayDesc.textContent = formData.description || "Không có mô tả bổ sung";
  const totalSections = formData.sections?.length || 1;
  formPagesBadge.textContent = `${totalSections} Phần / Trang`;

  formInfoSection.classList.remove('hidden');
  workspaceGrid.classList.remove('hidden');

  renderSectionTabs();
  renderCurrentSectionQuestions();
  populateChartQuestionSelect();
  initDistributionChart();
  lucide.createIcons();
}

/**
 * Render Section Tabs for Multi-page forms
 */
function renderSectionTabs() {
  sectionsTabBar.innerHTML = '';
  const sections = currentFormData.sections || [];

  sections.forEach((sec, idx) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = `cursor-pointer px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
      idx === currentSectionIndex
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
    }`;

    tabBtn.innerHTML = `
      <span class="w-5 h-5 rounded-full ${idx === currentSectionIndex ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'} flex items-center justify-center text-[10px] font-bold">
        ${idx + 1}
      </span>
      <span>${sec.title || `Phần ${idx + 1}`}</span>
      <span class="px-1.5 py-0.2 text-[10px] rounded-md bg-slate-800/80 text-slate-400 font-mono">${sec.questions?.length || 0} câu</span>
    `;

    tabBtn.addEventListener('click', () => {
      currentSectionIndex = idx;
      renderSectionTabs();
      renderCurrentSectionQuestions();
      lucide.createIcons();
    });

    sectionsTabBar.appendChild(tabBtn);
  });
}

/**
 * Render Questions for Current Active Section
 */
function renderCurrentSectionQuestions() {
  questionsListContainer.innerHTML = '';
  const section = currentFormData.sections?.[currentSectionIndex];

  if (!section || !section.questions || section.questions.length === 0) {
    questionsListContainer.innerHTML = `
      <div class="glass-card rounded-2xl p-8 text-center text-slate-500 text-xs">
        Phần này không có câu hỏi nào.
      </div>
    `;
    currentSectionQuestionCount.textContent = '0 câu hỏi';
    return;
  }

  currentSectionQuestionCount.textContent = `${section.questions.length} câu hỏi trong phần này`;

  section.questions.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4 hover:border-slate-700 transition';
    card.id = `q-card-${q.id}`;

    // Header of Question Card
    const headerHtml = `
      <div class="flex items-start justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              #${qIndex + 1}
            </span>
            <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ${q.typeName || q.type}
            </span>
            ${q.required ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Bắt buộc *</span>' : ''}
            ${q.entryId ? `<span class="text-[10px] font-mono text-slate-500">entry.${q.entryId}</span>` : ''}
          </div>
          <h4 class="text-sm font-bold text-slate-100 pt-0.5">${escapeHtml(q.title)}</h4>
          ${q.description ? `<p class="text-xs text-slate-400">${escapeHtml(q.description)}</p>` : ''}
        </div>
      </div>
    `;

    // Body based on question type
    let bodyHtml = '';
    if (q.type === 'radio' || q.type === 'dropdown' || q.type === 'scale') {
      bodyHtml = renderChoiceProbabilityConfig(q);
    } else if (q.type === 'checkbox') {
      bodyHtml = renderCheckboxConfig(q);
    } else if (q.type === 'text' || q.type === 'paragraph') {
      bodyHtml = renderTextConfig(q);
    } else if (q.type === 'radio_grid' || q.type === 'checkbox_grid') {
      bodyHtml = renderGridConfig(q);
    } else {
      bodyHtml = `
        <div class="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          Loại câu hỏi này sẽ được tự động tạo dữ liệu phù hợp khi gửi biểu mẫu.
        </div>
      `;
    }

    card.innerHTML = headerHtml + bodyHtml;
    questionsListContainer.appendChild(card);
    attachQuestionCardEvents(q, card);
  });
}

/**
 * Render Probability Sliders for Radio / Dropdown / Linear Scale
 */
function renderChoiceProbabilityConfig(q) {
  const weights = q.weights || [];
  const currentSum = weights.reduce((s, w) => s + (Number(w.weight) || 0), 0);
  const isBalanced = currentSum === 100;

  let optionsList = '';
  weights.forEach((item, optIdx) => {
    optionsList += `
      <div class="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition">
        <span class="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0">
          ${String.fromCharCode(65 + (optIdx % 26))}
        </span>
        <span class="text-xs text-slate-200 flex-1 truncate" title="${escapeHtml(item.label)}">
          ${escapeHtml(item.label)}
        </span>
        <div class="flex items-center gap-2 flex-shrink-0 w-48 sm:w-60">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value="${item.weight}" 
            data-opt-index="${optIdx}" 
            class="weight-slider w-full cursor-pointer"
          >
          <div class="relative w-14 flex-shrink-0">
            <input 
              type="number" 
              min="0" 
              max="100" 
              value="${item.weight}" 
              data-opt-index="${optIdx}" 
              class="weight-number-input w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold text-emerald-400 focus:outline-none"
            >
            <span class="absolute right-1 top-0.5 text-[10px] text-slate-500">%</span>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">Tỷ lệ xuất hiện:</span>
          <span id="sum-badge-${q.id}" class="px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
            isBalanced ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }">
            Tổng: ${currentSum}% ${isBalanced ? '✓' : '(Khuyến nghị 100%)'}
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <button data-action="equal-split" class="cursor-pointer text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition">
            Chia đều
          </button>
          <button data-action="auto-balance" class="cursor-pointer text-[11px] px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 transition">
            Cân bằng 100%
          </button>
        </div>
      </div>
      <div class="space-y-2">
        ${optionsList}
      </div>
    </div>
  `;
}

/**
 * Render Checkbox Configurator (Multi-select)
 */
function renderCheckboxConfig(q) {
  const cfg = q.checkboxConfig || { minSelect: 1, maxSelect: q.options?.length || 1, probabilities: [] };

  let optionsList = '';
  (q.options || []).forEach((opt, optIdx) => {
    const probItem = cfg.probabilities?.find(p => p.label === opt) || { chance: 50 };
    optionsList += `
      <div class="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
        <i data-lucide="check-square" class="w-4 h-4 text-cyan-400 flex-shrink-0"></i>
        <span class="text-xs text-slate-200 flex-1 truncate" title="${escapeHtml(opt)}">
          ${escapeHtml(opt)}
        </span>
        <div class="flex items-center gap-2 flex-shrink-0 w-48 sm:w-60">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value="${probItem.chance}" 
            data-chk-index="${optIdx}" 
            class="chk-slider w-full cursor-pointer"
          >
          <div class="relative w-14 flex-shrink-0">
            <input 
              type="number" 
              min="0" 
              max="100" 
              value="${probItem.chance}" 
              data-chk-index="${optIdx}" 
              class="chk-number-input w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono font-bold text-cyan-400 focus:outline-none"
            >
            <span class="absolute right-1 top-0.5 text-[10px] text-slate-500">%</span>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
        <span>Quy tắc chọn:</span>
        <div class="flex items-center gap-3 font-mono">
          <label class="flex items-center gap-1.5">
            <span>Tối thiểu:</span>
            <input type="number" min="0" max="${q.options?.length || 1}" value="${cfg.minSelect ?? 1}" class="chk-min-select w-12 bg-slate-950 border border-slate-700 rounded px-1 text-center text-xs text-slate-200">
          </label>
          <label class="flex items-center gap-1.5">
            <span>Tối đa:</span>
            <input type="number" min="1" max="${q.options?.length || 1}" value="${cfg.maxSelect ?? (q.options?.length || 1)}" class="chk-max-select w-12 bg-slate-950 border border-slate-700 rounded px-1 text-center text-xs text-slate-200">
          </label>
        </div>
      </div>
      <div class="space-y-2">
        ${optionsList}
      </div>
    </div>
  `;
}

/**
 * Render Text & Paragraph Configurator
 */
function renderTextConfig(q) {
  const cfg = q.textConfig || { mode: 'random_preset', customPool: [] };

  return `
    <div class="space-y-3">
      <div class="flex items-center gap-2">
        <label class="text-xs text-slate-400">Chế độ sinh nội dung tự động:</label>
        <select class="text-mode-select bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500">
          <option value="random_vietnamese_name" ${cfg.mode === 'random_vietnamese_name' ? 'selected' : ''}>Họ và tên Việt Nam ngẫu nhiên</option>
          <option value="random_email" ${cfg.mode === 'random_email' ? 'selected' : ''}>Email ngẫu nhiên (gmail, outlook)</option>
          <option value="random_phone" ${cfg.mode === 'random_phone' ? 'selected' : ''}>Số điện thoại Việt Nam ngẫu nhiên</option>
          <option value="random_preset" ${cfg.mode === 'random_preset' ? 'selected' : ''}>Ý kiến / Đánh giá mẫu tự nhiên</option>
          <option value="random_number" ${cfg.mode === 'random_number' ? 'selected' : ''}>Độ tuổi / Số ngẫu nhiên trong khoảng</option>
          <option value="custom_pool" ${cfg.mode === 'custom_pool' ? 'selected' : ''}>Tùy chỉnh danh sách câu trả lời riêng</option>
        </select>
      </div>

      <!-- Custom Pool Textarea (Hidden unless custom_pool is chosen) -->
      <div class="custom-pool-container ${cfg.mode === 'custom_pool' ? '' : 'hidden'} space-y-1.5">
        <span class="text-[11px] text-slate-400">Nhập danh sách câu trả lời (Mỗi dòng 1 câu, hệ thống sẽ bốc ngẫu nhiên mỗi lượt):</span>
        <textarea rows="3" class="custom-pool-textarea w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Câu trả lời 1&#10;Câu trả lời 2&#10;Câu trả lời 3">${(cfg.customPool || []).join('\n')}</textarea>
      </div>
    </div>
  `;
}

/**
 * Render Grid (Matrix) Configurator
 */
function renderGridConfig(q) {
  let rowsHtml = '';
  (q.config || []).forEach((row, rIdx) => {
    rowsHtml += `
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-200">${escapeHtml(row.rowTitle)}</span>
          <span class="text-[10px] font-mono text-slate-500">entry.${row.entryId}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          ${(row.weights || []).map((w, wIdx) => `
            <div class="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] flex items-center justify-between gap-1">
              <span class="truncate text-slate-300" title="${escapeHtml(w.label)}">${escapeHtml(w.label)}</span>
              <div class="relative w-12 flex-shrink-0">
                <input type="number" min="0" max="100" value="${w.weight}" data-row="${rIdx}" data-col="${wIdx}" class="grid-weight-input w-full bg-slate-900 border border-slate-700 rounded px-1 text-right font-mono font-bold text-emerald-400 text-[10px]">
                <span class="absolute right-0.5 top-0 text-[8px] text-slate-500">%</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  return `
    <div class="space-y-3">
      <span class="text-xs text-slate-400">Cấu hình xác suất cho từng hàng trong lưới ma trận:</span>
      <div class="space-y-2">
        ${rowsHtml}
      </div>
    </div>
  `;
}

/**
 * Attach live events to inputs inside question card
 */
function attachQuestionCardEvents(q, card) {
  // Radio / scale sliders
  const sliders = card.querySelectorAll('.weight-slider');
  const numberInputs = card.querySelectorAll('.weight-number-input');

  sliders.forEach(sl => {
    sl.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.optIndex);
      const val = Number(e.target.value);
      q.weights[idx].weight = val;
      if (numberInputs[idx]) numberInputs[idx].value = val;
      updateSumBadge(q, card);
    });
  });

  numberInputs.forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.optIndex);
      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
      q.weights[idx].weight = val;
      if (sliders[idx]) sliders[idx].value = val;
      updateSumBadge(q, card);
    });
  });

  // Action buttons
  const btnEqual = card.querySelector('[data-action="equal-split"]');
  if (btnEqual) {
    btnEqual.addEventListener('click', () => {
      const len = q.weights.length;
      if (len === 0) return;
      const base = Math.floor(100 / len);
      const rem = 100 - base * len;
      q.weights.forEach((w, i) => {
        w.weight = base + (i === 0 ? rem : 0);
      });
      syncCardWeightsUI(q, card);
    });
  }

  const btnBalance = card.querySelector('[data-action="auto-balance"]');
  if (btnBalance) {
    btnBalance.addEventListener('click', () => {
      autoBalanceQuestion(q);
      syncCardWeightsUI(q, card);
    });
  }

  // Checkbox sliders & numbers
  const chkSliders = card.querySelectorAll('.chk-slider');
  const chkNumbers = card.querySelectorAll('.chk-number-input');
  chkSliders.forEach(sl => {
    sl.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.optIndex || e.target.dataset.chkIndex);
      const val = Number(e.target.value);
      if (q.checkboxConfig && q.checkboxConfig.probabilities[idx]) {
        q.checkboxConfig.probabilities[idx].chance = val;
      }
      if (chkNumbers[idx]) chkNumbers[idx].value = val;
    });
  });

  chkNumbers.forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = Number(e.target.dataset.chkIndex);
      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
      if (q.checkboxConfig && q.checkboxConfig.probabilities[idx]) {
        q.checkboxConfig.probabilities[idx].chance = val;
      }
      if (chkSliders[idx]) chkSliders[idx].value = val;
    });
  });

  const minSel = card.querySelector('.chk-min-select');
  if (minSel) {
    minSel.addEventListener('change', (e) => {
      if (q.checkboxConfig) q.checkboxConfig.minSelect = Number(e.target.value);
    });
  }

  const maxSel = card.querySelector('.chk-max-select');
  if (maxSel) {
    maxSel.addEventListener('change', (e) => {
      if (q.checkboxConfig) q.checkboxConfig.maxSelect = Number(e.target.value);
    });
  }

  // Text mode select
  const textSelect = card.querySelector('.text-mode-select');
  const customContainer = card.querySelector('.custom-pool-container');
  const customTextarea = card.querySelector('.custom-pool-textarea');

  if (textSelect) {
    textSelect.addEventListener('change', (e) => {
      if (!q.textConfig) q.textConfig = {};
      q.textConfig.mode = e.target.value;
      if (customContainer) {
        if (e.target.value === 'custom_pool') {
          customContainer.classList.remove('hidden');
        } else {
          customContainer.classList.add('hidden');
        }
      }
    });
  }

  if (customTextarea) {
    customTextarea.addEventListener('input', (e) => {
      if (!q.textConfig) q.textConfig = {};
      q.textConfig.customPool = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    });
  }

  // Grid weight inputs
  const gridInputs = card.querySelectorAll('.grid-weight-input');
  gridInputs.forEach(gInp => {
    gInp.addEventListener('input', (e) => {
      const rIdx = Number(e.target.dataset.row);
      const cIdx = Number(e.target.dataset.col);
      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
      if (q.config && q.config[rIdx] && q.config[rIdx].weights[cIdx]) {
        q.config[rIdx].weights[cIdx].weight = val;
      }
    });
  });
}

function updateSumBadge(q, card) {
  const currentSum = (q.weights || []).reduce((s, w) => s + (Number(w.weight) || 0), 0);
  const badge = card.querySelector(`#sum-badge-${q.id}`);
  if (badge) {
    const isBalanced = currentSum === 100;
    badge.className = `px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
      isBalanced ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
    }`;
    badge.textContent = `Tổng: ${currentSum}% ${isBalanced ? '✓' : '(Chưa tròn 100%)'}`;
  }
}

function syncCardWeightsUI(q, card) {
  const sliders = card.querySelectorAll('.weight-slider');
  const numberInputs = card.querySelectorAll('.weight-number-input');
  q.weights.forEach((w, idx) => {
    if (sliders[idx]) sliders[idx].value = w.weight;
    if (numberInputs[idx]) numberInputs[idx].value = w.weight;
  });
  updateSumBadge(q, card);
}

function autoBalanceQuestion(q) {
  if (!q.weights || q.weights.length === 0) return;
  const total = q.weights.reduce((sum, w) => sum + (Number(w.weight) || 0), 0);
  if (total <= 0) {
    const equal = Math.floor(100 / q.weights.length);
    q.weights.forEach(w => w.weight = equal);
    q.weights[0].weight += (100 - equal * q.weights.length);
    return;
  }
  let acc = 0;
  q.weights.forEach((w, idx) => {
    if (idx === q.weights.length - 1) {
      w.weight = Math.max(0, 100 - acc);
    } else {
      const normalized = Math.round((Number(w.weight) / total) * 100);
      w.weight = normalized;
      acc += normalized;
    }
  });
}

function handleAutoBalanceAll() {
  if (!currentFormData || !currentFormData.sections) return;
  currentFormData.sections.forEach(sec => {
    (sec.questions || []).forEach(q => {
      if (q.weights && q.weights.length > 0) {
        autoBalanceQuestion(q);
      }
    });
  });
  renderCurrentSectionQuestions();
  lucide.createIcons();
}

/**
 * Single Test Submission
 */
async function handleTestSingle() {
  if (!currentFormData || !currentFormData.actionUrl) {
    showError("Vui lòng phân tích biểu mẫu trước khi gửi thử.");
    return;
  }

  btnTestSingle.disabled = true;
  btnTestSingle.innerHTML = `<span class="animate-spin inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full mr-1"></span> Đang gửi...`;

  try {
    const res = await fetch('/api/test-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: currentFormData })
    });

    const data = await res.json();
    if (data.success) {
      alert(`🎉 Gửi thử thành công!\n\nThời gian xử lý: ${data.result.durationMs}ms\n\nNội dung đã gửi:\n${data.answersSummary.map(a => `• ${a.question}: ${a.answer}`).join('\n')}`);
    } else {
      alert(`⚠️ Kết quả gửi thử: ${data.result?.message || data.error}\n(Lưu ý: Nếu Google Form yêu cầu đăng nhập thì không thể gửi bằng HTTP không phiên đăng nhập)`);
    }
  } catch (err) {
    alert(`Lỗi khi gửi thử: ${err.message}`);
  } finally {
    btnTestSingle.disabled = false;
    btnTestSingle.innerHTML = `<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-cyan-400"></i><span>Gửi thử 1 mẫu</span>`;
    lucide.createIcons();
  }
}

/**
 * Start Batch Job
 */
async function handleStartBatch() {
  if (!currentFormData || !currentFormData.actionUrl) {
    showError("Vui lòng phân tích biểu mẫu trước khi bắt đầu.");
    return;
  }

  const totalCount = Number(inputTotalCount.value) || 20;
  const minDelay = Number(inputMinDelay.value) || 600;
  const maxDelay = Number(inputMaxDelay.value) || 1200;

  btnStartBatch.disabled = true;
  btnStartBatch.classList.add('opacity-50');

  try {
    const res = await fetch('/api/batch/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formData: currentFormData,
        totalCount,
        minDelay,
        maxDelay
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Không thể khởi động tiến trình gửi.');
    }

    activeJobId = data.jobId;
    isJobRunning = true;
    isJobPaused = false;
    allLogs = [];
    liveLogsContainer.innerHTML = '';

    setJobStatusUI('running');
    btnPauseJob.disabled = false;
    btnStopJob.disabled = false;

    // Connect to SSE stream
    connectToJobStream(activeJobId);
  } catch (err) {
    showError(err.message);
    btnStartBatch.disabled = false;
    btnStartBatch.classList.remove('opacity-50');
  }
}

/**
 * SSE Stream Connector
 */
function connectToJobStream(jobId) {
  if (activeEventSource) {
    activeEventSource.close();
  }

  activeEventSource = new EventSource(`/api/batch/stream/${jobId}`);

  activeEventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'progress' || payload.status) {
        const snap = payload.data || payload;
        updateDashboardMetrics(snap);

        if (payload.latestLog) {
          appendLogEntry(payload.latestLog);
          allLogs.push(payload.latestLog);
        }

        if (snap.distributionStats) {
          updateChartData(snap.distributionStats);
        }
      }

      if (payload.type === 'completed') {
        const snap = payload.data;
        updateDashboardMetrics(snap);
        setJobStatusUI('completed');
        btnStartBatch.disabled = false;
        btnStartBatch.classList.remove('opacity-50');
        btnPauseJob.disabled = true;
        btnStopJob.disabled = true;
        activeEventSource.close();
      }

      if (payload.type === 'status_changed') {
        setJobStatusUI(payload.status);
      }
    } catch (e) {
      console.error("Error reading stream message:", e);
    }
  };

  activeEventSource.onerror = () => {
    console.log("Stream disconnected or completed");
  };
}

function updateDashboardMetrics(snap) {
  statProgressText.textContent = `${snap.submittedCount} / ${snap.totalCount} (${snap.percent}%)`;
  statProgressBar.style.width = `${snap.percent}%`;
  statSuccessCount.textContent = snap.successCount;
  statFailedCount.textContent = snap.failedCount;
  statSpeed.textContent = `${snap.speed} req/s`;
  statRemainingTime.textContent = `${snap.remainingSec}s`;
}

function appendLogEntry(log) {
  if (liveLogsContainer.children.length === 1 && liveLogsContainer.children[0].textContent.includes('Chưa có lượt gửi nào')) {
    liveLogsContainer.innerHTML = '';
  }

  const row = document.createElement('div');
  row.className = `p-1.5 rounded flex items-center justify-between gap-2 border ${
    log.ok ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
  }`;

  row.innerHTML = `
    <div class="flex items-center gap-1.5 truncate">
      <span class="font-bold text-[10px] ${log.ok ? 'text-emerald-400' : 'text-rose-400'}">#${log.index}</span>
      <span class="text-slate-500 text-[10px]">${log.timestamp}</span>
      <span class="truncate text-slate-300 text-[10px]" title="${escapeHtml(log.sampleAnswer)}">${escapeHtml(log.sampleAnswer)}</span>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0 font-mono text-[10px]">
      <span class="text-slate-400">${log.durationMs}ms</span>
      <span class="px-1 py-0.2 rounded font-bold ${log.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">${log.status}</span>
    </div>
  `;

  liveLogsContainer.insertBefore(row, liveLogsContainer.firstChild);

  // Keep max 50 rows in DOM
  if (liveLogsContainer.children.length > 50) {
    liveLogsContainer.removeChild(liveLogsContainer.lastChild);
  }
}

/**
 * Pause / Resume Toggle
 */
async function handleTogglePause() {
  if (!activeJobId) return;

  if (!isJobPaused) {
    await fetch(`/api/batch/pause/${activeJobId}`, { method: 'POST' });
    isJobPaused = true;
    btnPauseText.textContent = 'Tiếp tục';
    setJobStatusUI('paused');
  } else {
    await fetch(`/api/batch/resume/${activeJobId}`, { method: 'POST' });
    isJobPaused = false;
    btnPauseText.textContent = 'Tạm dừng';
    setJobStatusUI('running');
  }
}

/**
 * Stop Batch Job
 */
async function handleStopJob() {
  if (!activeJobId) return;
  if (!confirm('Bạn có chắc chắn muốn dừng quá trình điền?')) return;

  await fetch(`/api/batch/stop/${activeJobId}`, { method: 'POST' });
  isJobRunning = false;
  btnStartBatch.disabled = false;
  btnStartBatch.classList.remove('opacity-50');
  btnPauseJob.disabled = true;
  btnStopJob.disabled = true;
  setJobStatusUI('stopped');
}

function setJobStatusUI(status) {
  jobStatusPill.className = 'flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border';

  if (status === 'running') {
    jobStatusPill.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/30');
    jobStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 pulse-active"></span><span>Đang chạy...</span>`;
  } else if (status === 'paused') {
    jobStatusPill.classList.add('bg-amber-500/10', 'text-amber-400', 'border-amber-500/30');
    jobStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Tạm dừng</span>`;
  } else if (status === 'completed') {
    jobStatusPill.classList.add('bg-cyan-500/10', 'text-cyan-400', 'border-cyan-500/30');
    jobStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400"></span><span>Hoàn thành ✓</span>`;
  } else if (status === 'stopped') {
    jobStatusPill.classList.add('bg-rose-500/10', 'text-rose-400', 'border-rose-500/30');
    jobStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400"></span><span>Đã dừng</span>`;
  } else {
    jobStatusPill.classList.add('bg-slate-800', 'text-slate-400', 'border-slate-700');
    jobStatusPill.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>Sẵn sàng</span>`;
  }
}

/**
 * Chart.js Integration for Live Distribution Monitoring
 */
function initDistributionChart() {
  const ctx = document.getElementById('distribution-chart').getContext('2d');
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Đang chờ...'],
      datasets: [{
        label: 'Số lần chọn thực tế',
        data: [0],
        backgroundColor: '#10b981',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#10b981',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 },
          grid: { color: '#1e293b' }
        }
      }
    }
  });
}

function populateChartQuestionSelect() {
  selectChartQuestion.innerHTML = '';
  if (!currentFormData) return;

  currentFormData.sections?.forEach(sec => {
    (sec.questions || []).forEach(q => {
      if (q.options && q.options.length > 0) {
        const opt = document.createElement('option');
        opt.value = q.title;
        opt.textContent = q.title;
        selectChartQuestion.appendChild(opt);
      }
    });
  });
}

function updateChartDisplay() {
  if (!chartInstance || !currentFormData) return;
  const qTitle = selectChartQuestion.value;
  if (!qTitle) return;

  let matchedQ = null;
  for (const sec of currentFormData.sections || []) {
    matchedQ = (sec.questions || []).find(q => q.title === qTitle);
    if (matchedQ) break;
  }

  if (matchedQ && matchedQ.options) {
    chartInstance.data.labels = matchedQ.options.map(o => o.length > 15 ? o.substring(0, 15) + '...' : o);
    chartInstance.data.datasets[0].data = matchedQ.options.map(() => 0);
    chartInstance.update();
  }
}

function updateChartData(distStats) {
  if (!chartInstance || !selectChartQuestion.value) return;
  const qTitle = selectChartQuestion.value;
  const counts = distStats[qTitle];
  if (!counts) return;

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  chartInstance.data.labels = labels.map(l => l.length > 15 ? l.substring(0, 15) + '...' : l);
  chartInstance.data.datasets[0].data = data;
  chartInstance.update('none');
}

/**
 * Preset Management Logic (Multiple Presets in LocalStorage + Export/Import)
 */

function getSavedPresets() {
  try {
    const raw = localStorage.getItem(FORMFLOW_PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading presets:", e);
    return [];
  }
}

function setSavedPresets(presets) {
  try {
    localStorage.setItem(FORMFLOW_PRESETS_KEY, JSON.stringify(presets));
    updatePresetsBadge();
  } catch (e) {
    alert("Không thể lưu cấu hình vào bộ nhớ trình duyệt: " + e.message);
  }
}

function updatePresetsBadge() {
  const presets = getSavedPresets();
  const count = presets.length;
  if (badgePresetsCount) badgePresetsCount.textContent = count;
  if (modalPresetsTotalBadge) modalPresetsTotalBadge.textContent = `${count} cấu hình`;
}

function openSavePresetModal() {
  if (!currentFormData || !currentFormData.actionUrl) {
    showError("Vui lòng phân tích biểu mẫu trước khi lưu cấu hình.");
    return;
  }

  const totalQ = (currentFormData.sections || []).reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  saveModalFormTitle.textContent = currentFormData.title || "Biểu mẫu không tên";
  saveModalQCount.textContent = `${totalQ} câu hỏi`;
  saveModalRunsCount.textContent = `${inputTotalCount.value || 20} lượt`;

  // Default suggested preset name
  inputSavePresetName.value = `${currentFormData.title || 'Cấu hình'} (${new Date().toLocaleDateString('vi-VN')})`;
  savePresetModal.classList.remove('hidden');
  savePresetModal.classList.add('flex');
  inputSavePresetName.focus();
  inputSavePresetName.select();
  lucide.createIcons();
}

function closeSavePresetModal() {
  savePresetModal.classList.add('hidden');
  savePresetModal.classList.remove('flex');
}

function handleConfirmSavePreset() {
  const name = inputSavePresetName.value.trim();
  if (!name) {
    alert("Vui lòng nhập tên cho cấu hình.");
    return;
  }

  if (!currentFormData) return;

  const totalQ = (currentFormData.sections || []).reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  const presets = getSavedPresets();

  const newPreset = {
    id: 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: name,
    formTitle: currentFormData.title || "Biểu mẫu",
    formUrl: inputFormUrl.value.trim() || currentFormData.actionUrl,
    totalQuestions: totalQ,
    savedAt: new Date().toLocaleString('vi-VN'),
    formData: JSON.parse(JSON.stringify(currentFormData)),
    settings: {
      totalCount: Number(inputTotalCount.value) || 20,
      minDelay: Number(inputMinDelay.value) || 600,
      maxDelay: Number(inputMaxDelay.value) || 1200
    }
  };

  // Check if a preset with identical name already exists -> update it or prepend new
  const existingIdx = presets.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  if (existingIdx !== -1) {
    if (confirm(`Cấu hình "${name}" đã tồn tại. Bạn có muốn ghi đè cấu hình này không?`)) {
      presets[existingIdx] = newPreset;
    } else {
      return;
    }
  } else {
    presets.unshift(newPreset);
  }

  setSavedPresets(presets);
  closeSavePresetModal();
  alert(`✅ Đã lưu cấu hình "${name}" thành công vào bộ nhớ trình duyệt!`);
}

function openPresetsManagerModal() {
  renderPresetsList(inputSearchPresets.value.trim());
  presetsManagerModal.classList.remove('hidden');
  presetsManagerModal.classList.add('flex');
  lucide.createIcons();
}

function closePresetsManagerModal() {
  presetsManagerModal.classList.add('hidden');
  presetsManagerModal.classList.remove('flex');
}

function renderPresetsList(searchTerm = '') {
  const presets = getSavedPresets();
  presetsListContainer.innerHTML = '';

  const filtered = searchTerm
    ? presets.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.formTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    : presets;

  if (filtered.length === 0) {
    presetsListContainer.innerHTML = `
      <div class="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
        <i data-lucide="bookmark-x" class="w-8 h-8 text-slate-600 mx-auto"></i>
        <p class="text-xs text-slate-400">${searchTerm ? 'Không tìm thấy cấu hình phù hợp.' : 'Chưa có cấu hình nào được lưu.'}</p>
        <p class="text-[11px] text-slate-500">Mở một biểu mẫu, chỉnh xác suất và bấm "Lưu cấu hình" để bắt đầu lưu trữ.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-xl p-3.5 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3';
    
    card.innerHTML = `
      <div class="space-y-1 flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[260px]" title="${escapeHtml(p.name)}">
            ${escapeHtml(p.name)}
          </span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
            ${p.savedAt}
          </span>
        </div>
        <div class="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
          <span class="truncate max-w-[200px] text-cyan-400 flex items-center gap-1" title="${escapeHtml(p.formTitle)}">
            <i data-lucide="file-text" class="w-3 h-3"></i>
            ${escapeHtml(p.formTitle)}
          </span>
          <span class="font-mono text-emerald-400 font-medium">• ${p.totalQuestions} câu hỏi</span>
          <span class="font-mono text-slate-400">• ${p.settings?.totalCount || 20} lượt</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <button data-action="apply" data-id="${p.id}" class="cursor-pointer px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1 transition shadow-sm">
          <i data-lucide="play" class="w-3 h-3 text-slate-950"></i>
          <span>Áp dụng</span>
        </button>
        <button data-action="export-single" data-id="${p.id}" class="cursor-pointer p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition" title="Tải file JSON cấu hình này">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
        </button>
        <button data-action="delete" data-id="${p.id}" class="cursor-pointer p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-rose-900/40 transition" title="Xóa cấu hình">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    // Attach event listeners
    const btnApply = card.querySelector('[data-action="apply"]');
    btnApply.addEventListener('click', () => handleApplyPreset(p));

    const btnExport = card.querySelector('[data-action="export-single"]');
    btnExport.addEventListener('click', () => handleExportSinglePreset(p));

    const btnDelete = card.querySelector('[data-action="delete"]');
    btnDelete.addEventListener('click', () => handleDeletePreset(p.id, p.name));

    presetsListContainer.appendChild(card);
  });

  lucide.createIcons();
}

function handleApplyPreset(preset) {
  if (!preset || !preset.formData) return;

  if (preset.formUrl) {
    inputFormUrl.value = preset.formUrl;
  }
  if (preset.settings) {
    if (preset.settings.totalCount) inputTotalCount.value = preset.settings.totalCount;
    if (preset.settings.minDelay) inputMinDelay.value = preset.settings.minDelay;
    if (preset.settings.maxDelay) inputMaxDelay.value = preset.settings.maxDelay;
  }

  loadFormDataIntoUI(JSON.parse(JSON.stringify(preset.formData)));
  closePresetsManagerModal();

  alert(`⚡ Đã nạp thành công cấu hình "${preset.name}"!\nBạn có thể kiểm tra các tỷ lệ xác suất và bắt đầu chạy.`);
}

function handleDeletePreset(presetId, presetName) {
  if (!confirm(`Bạn có chắc chắn muốn xóa cấu hình "${presetName}"?`)) return;

  let presets = getSavedPresets();
  presets = presets.filter(p => p.id !== presetId);
  setSavedPresets(presets);
  renderPresetsList(inputSearchPresets.value.trim());
}

function handleExportSinglePreset(preset) {
  const jsonContent = JSON.stringify(preset, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = preset.name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  a.href = url;
  a.download = `formflow_preset_${safeName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleExportAllPresets() {
  const presets = getSavedPresets();
  if (presets.length === 0) {
    alert("Chưa có cấu hình nào để xuất file.");
    return;
  }

  const jsonContent = JSON.stringify(presets, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `formflow_all_presets_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleImportPresetsFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      let listToImport = [];

      if (Array.isArray(imported)) {
        listToImport = imported;
      } else if (imported && (imported.formData || imported.name)) {
        listToImport = [imported];
      } else {
        throw new Error("File JSON không đúng cấu trúc của FormFlow Auto.");
      }

      let currentPresets = getSavedPresets();
      let addedCount = 0;

      listToImport.forEach(item => {
        if (!item.name || !item.formData) return;
        // Re-generate ID to avoid conflict
        item.id = 'preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        currentPresets.unshift(item);
        addedCount++;
      });

      setSavedPresets(currentPresets);
      renderPresetsList(inputSearchPresets.value.trim());
      alert(`🎉 Đã nhập thành công ${addedCount} cấu hình từ file!`);
    } catch (err) {
      alert("Lỗi khi đọc file cấu hình: " + err.message);
    } finally {
      inputImportPresetFile.value = '';
    }
  };

  reader.readAsText(file);
}

function handleClearAllPresets() {
  const presets = getSavedPresets();
  if (presets.length === 0) return;

  if (confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách cấu hình đã lưu không?")) {
    setSavedPresets([]);
    renderPresetsList();
    alert("Đã xóa toàn bộ cấu hình đã lưu.");
  }
}

/**
 * Export Logs
 */
function handleExportLogs() {
  if (allLogs.length === 0) {
    alert('Chưa có dữ liệu nhật ký để xuất.');
    return;
  }

  const csvRows = [
    ["Luot", "ThoiGian", "TrangThai", "MaCode", "DoTre_ms", "CauTraLoi"]
  ];

  allLogs.forEach(l => {
    csvRows.push([
      l.index,
      l.timestamp,
      l.ok ? 'Thành công' : 'Thất bại',
      l.status,
      l.durationMs,
      `"${(l.sampleAnswer || '').replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = "\uFEFF" + csvRows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `formflow_logs_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Helpers
function setParseLoading(isLoading) {
  btnParseForm.disabled = isLoading;
  if (isLoading) {
    btnParseText.textContent = 'Đang phân tích...';
    btnParseSpinner.classList.remove('hidden');
  } else {
    btnParseText.textContent = 'Phân tích biểu mẫu';
    btnParseSpinner.classList.add('hidden');
  }
}

function showError(msg) {
  parseErrorText.textContent = msg;
  parseErrorAlert.classList.remove('hidden');
}

function hideError() {
  parseErrorAlert.classList.add('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
