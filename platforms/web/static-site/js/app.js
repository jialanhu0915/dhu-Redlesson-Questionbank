/**
 * ??????????
 */

// ????? Electron ???
const isElectron = window.electronAPI !== undefined;
const API_BASE = isElectron ? '' : '';

// ==================== ???? ====================
let currentPage = 'dashboard';
let practiceQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let correctCount = 0;
let wrongCount = 0;
let currentBankName = '';
let editingQuestionId = null;
let serverOnline = true;
let healthCheckInterval = null;
let practiceTimer = null;
let remainingTime = 0;
let practiceStartTime = null;
let isExamMode = false;  // ??????
let questionResults = []; // ??????????
let lastPracticeSettings = null; // ????????
let isBackMode = false; // ?????????????
let editOptionsState = []; // ????????????
let currentPracticeMode = 'random'; // ???????random/exam/sequence/wrong
let currentWrongBankName = ''; // ???????
let currentProgressId = null; // ????ID????????
let loadedElapsedTime = 0; // ??????????????
let navCurrentPage = 1; // ???????
const NAV_PAGE_SIZE = 56; // ?????????

// ==================== ??? ====================
document.addEventListener('DOMContentLoaded', async function() {
    initNavigation();
    initFeaturesCarousel();

    if (!window.STATIC_MODE) {
        initUpload();
    }

    // Electron ??????
    if (isElectron) {
        serverOnline = true;
        await loadStats();
    }

    if (window.STATIC_MODE) {
        serverOnline = true;
        await loadStats();
        loadBankChapters();
    }

    await loadConfig();

    // Electron ??????????????
    if (!isElectron && !window.STATIC_MODE) {
        startHealthCheck();
    }

    // ????????
    document.body.setAttribute('data-page', 'dashboard');

    // ?????????????onclick???
    window.changeNavPage = changeNavPage;
    window.togglePanel = togglePanel;

    initAnimations();
});

// ==================== ?????? ====================
function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

// ==================== ??????? ====================
function startHealthCheck() {
    // ?3??????????
    healthCheckInterval = setInterval(checkServerHealth, 3000);
    // ??????
    checkServerHealth();
}

async function checkServerHealth() {
    try {
        if (isElectron) {
            // Electron ??
            await window.electronAPI.healthCheck();
            if (!serverOnline) {
                serverOnline = true;
                hideServerError();
                showToast('???????', 'success');
                switchPage(currentPage);
            }
        } else {
            // Web ??
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch(`${API_BASE}/api/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                if (!serverOnline) {
                    serverOnline = true;
                    hideServerError();
                    showToast('????????', 'success');
                    // ??????????
                    switchPage(currentPage);
                }
            } else {
                handleServerOffline();
            }
        }
    } catch (error) {
        handleServerOffline();
    }
}

function handleServerOffline() {
    if (serverOnline) {
        serverOnline = false;
        showServerError();
        showToast('????????????????????', 'error');
        
        // ????????????
        if (practiceTimer) {
            clearInterval(practiceTimer);
            practiceTimer = null;
            showToast('???????', 'warning');
        }
    }
}

function showServerError() {
    let errorBanner = document.getElementById('server-error-banner');
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'server-error-banner';
        errorBanner.className = 'server-error-banner';
        errorBanner.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>????????????????????</span>
            <button onclick="checkServerHealth()" class="btn btn-small">????</button>
        `;
        document.body.insertBefore(errorBanner, document.body.firstChild);
    }
    errorBanner.style.display = 'flex';
}

function hideServerError() {
    const errorBanner = document.getElementById('server-error-banner');
    if (errorBanner) {
        errorBanner.style.display = 'none';
    }
}

// ==================== ?? ====================
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            switchPage(page);
            closeMobileNav();
        });
    });

    var menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            toggleMobileNav();
        });
    }
}

function toggleMobileNav() {
    var links = document.querySelector('.nav-links');
    var btn = document.querySelector('.mobile-menu-btn');
    if (!links) return;
    links.classList.toggle('mobile-open');
    if (btn) btn.classList.toggle('active');
}

function closeMobileNav() {
    var links = document.querySelector('.nav-links');
    var btn = document.querySelector('.mobile-menu-btn');
    if (links) links.classList.remove('mobile-open');
    if (btn) btn.classList.remove('active');
}

function switchPage(page) {
    document.querySelectorAll('.nav-link').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // ????
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    
    currentPage = page;
    
    document.body.setAttribute('data-page', page);
    
    if (page === 'dashboard') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    switch(page) {
        case 'dashboard':
            loadStats();
            loadBankChapters();
            resetScrollReveal();
            break;
        case 'manage':
            loadBanks();
            break;
        case 'wrongbook':
            loadWrongBanks();
            break;
        case 'practice':
            loadPracticeOptions();
            showPracticeSettings();
            loadRankings();
            loadProgressList();
            break;
        case 'settings':
            loadConfig();
            break;
    }
}

// ==================== ???? ====================
async function loadStats() {
    try {
        // ?? StorageService ????
        const data = await window.storageService.getStats();

        if (data.success) {
            const stats = data.stats;
            document.getElementById('total-banks').textContent = stats.total_banks;
            document.getElementById('total-questions').textContent = stats.total_questions;
            document.getElementById('single-count').textContent = stats.single_choice_count;
            document.getElementById('multi-count').textContent = stats.multi_choice_count;
        }
    } catch (error) {
        console.error('????????:', error);
    }
    loadWrongBookOverview();
}

async function loadWrongBookOverview() {
    try {
        const data = await window.storageService.getWrongbookStats();
        if (!data || !data.success) return;
        const bankStats = data.stats;
        const wbTotal = document.getElementById('wb-total');
        const wbBanks = document.getElementById('wb-banks');
        const wbReviewed = document.getElementById('wb-reviewed');
        if (!wbTotal) return;
        let totalWrong = 0;
        let bankCount = 0;
        for (const bank in bankStats) {
            totalWrong += bankStats[bank].total || 0;
            bankCount++;
        }
        wbTotal.textContent = totalWrong;
        wbBanks.textContent = bankCount;
        wbReviewed.textContent = '0';
    } catch(e) {
        console.error('?????????:', e);
    }
}

// ????????????
async function loadBankChapters() {
    try {
        // ?? StorageService ????
        const data = await window.storageService.getStatsByBank();
        
        const container = document.getElementById('bank-chapters-container');
        if (!container) return;
        
        if (data.success && Object.keys(data.stats).length > 0) {
            container.innerHTML = Object.entries(data.stats).map(([bankName, bankData]) => {
                const chaptersHtml = Object.entries(bankData.chapters).map(([chapterName, count]) => `
                    <div class="chapter-item">
                        <span class="chapter-name" title="${chapterName}">${chapterName}</span>
                        <span class="chapter-count">${count}?</span>
                    </div>
                `).join('');
                
                return `
                    <div class="bank-chapter-group">
                        <div class="bank-title">
                            <i class="fas fa-book"></i>
                            ${bankName}
                            <span class="bank-count">(?${bankData.total}?)</span>
                        </div>
                        <div class="chapter-list">
                            ${chaptersHtml}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>???????????</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('????????:', error);
    }
}

// ==================== ???? ====================
function initUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

    if (isElectron) {
        // Electron ?????????????????
        uploadArea.addEventListener('click', async () => {
            console.log('??? ??????');
            try {
                const result = await window.electronAPI.showOpenDialog({
                    title: '??????',
                    filters: [
                        { name: '????', extensions: ['txt', 'doc', 'docx'] },
                        { name: '????', extensions: ['*'] }
                    ],
                    properties: ['openFile']
                });

                console.log('?? showOpenDialog ??:', result);

                if (result.canceled || result.filePaths.length === 0) {
                    console.log('? ?????????');
                    return; // ???????
                }

                const filePath = result.filePaths[0];
                const fileName = filePath.split(/[/\\]/).pop();
                console.log('? ????? - filePath:', filePath, 'fileName:', fileName);
                handleFileSelectElectron(filePath, fileName);
            } catch (error) {
                console.error('? ??????:', error);
                showToast('??????', 'error');
            }
        });

        // Electron ???????????????????????????????
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            console.log('?? ?????');

            // Electron ??????????????????
            console.log('?? Electron ???????????????');
            showToast('??????????????????', 'warning');
        });
    } else {
        // Web ???????????
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
}

function handleFileSelectElectron(filePath, fileName) {
    console.log('?? handleFileSelectElectron ??? - filePath:', filePath, 'fileName:', fileName);

    const allowedTypes = ['.txt', '.doc', '.docx'];
    const ext = '.' + fileName.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
        console.error('? ???????:', ext);
        showToast('??? .txt?.doc ? .docx ?????', 'error');
        return;
    }

    document.getElementById('file-name').textContent = fileName;
    document.getElementById('selected-file').style.display = 'flex';
    document.getElementById('import-btn').disabled = false;

    // ???????????
    const fileInput = document.getElementById('file-input');
    fileInput.dataset.filePath = filePath;
    console.log('?? ??? dataset.filePath:', fileInput.dataset.filePath);
}

function handleFileSelect(file) {
    const allowedTypes = ['.txt', '.doc', '.docx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
        showToast('??? .txt?.doc ? .docx ?????', 'error');
        return;
    }
    
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('selected-file').style.display = 'flex';
    document.getElementById('import-btn').disabled = false;
    
    // ??????
    document.getElementById('file-input').files = createFileList(file);
}

function createFileList(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
}

function clearFile() {
    document.getElementById('file-input').value = '';
    delete document.getElementById('file-input').dataset.filePath;
    document.getElementById('selected-file').style.display = 'none';
    document.getElementById('import-btn').disabled = true;
    document.getElementById('import-result').style.display = 'none';
}

async function importFile() {
    const bankName = document.getElementById('bank-name').value.trim();

    console.log('?? ?????? - bankName:', bankName, 'isElectron:', isElectron);

    // ????
    document.getElementById('import-progress').style.display = 'block';
    document.getElementById('import-result').style.display = 'none';
    document.getElementById('import-btn').disabled = true;

    try {
        let data;

        if (isElectron) {
            // Electron ???? dataset ??????
            const fileInput = document.getElementById('file-input');
            const filePath = fileInput.dataset.filePath;

            console.log('?? Electron ?? - fileInput:', fileInput);
            console.log('?? dataset.filePath:', filePath);

            if (!filePath) {
                document.getElementById('import-progress').style.display = 'none';
                document.getElementById('import-btn').disabled = false;
                showToast('??????', 'error');
                return; // ?????????
            }

            console.log('?? ?? electronAPI.importQuestions - filePath:', filePath, 'bankName:', bankName);
            data = await window.electronAPI.importQuestions(filePath, bankName);
        } else if (window.storageService && window.storageService.isMobile) {
            // Mobile ???????
            const fileInput = document.getElementById('file-input');
            if (!fileInput.files.length) {
                showToast('??????', 'error');
                document.getElementById('import-progress').style.display = 'none';
                document.getElementById('import-btn').disabled = false;
                return;
            }

            try {
                const file = fileInput.files[0];
                const effectiveBankName = bankName || file.name.replace(/\.[^/.]+$/, "");
                const questions = await window.questionParser.parseFile(file);

                if (!questions || questions.length === 0) throw new Error("?????????");

                const result = await window.storageService.importQuestions(effectiveBankName, questions);
                if (result.success) {
                    data = { success: true, message: `???? ${result.count} ???` };
                } else {
                    data = { success: false, error: result.error };
                }
            } catch (e) {
                console.error("Import error:", e);
                data = { success: false, error: e.message };
            }

        } else {
            // Web ?????????
            const fileInput = document.getElementById('file-input');

            if (!fileInput.files.length) {
                showToast('??????', 'error');
                document.getElementById('import-progress').style.display = 'none';
                document.getElementById('import-btn').disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            if (bankName) {
                formData.append('bank_name', bankName);
            }

            const response = await fetch(`${API_BASE}/api/import`, {
                method: 'POST',
                body: formData
            });

            data = await response.json();
        }

        document.getElementById('import-progress').style.display = 'none';
        const resultDiv = document.getElementById('import-result');
        resultDiv.style.display = 'block';

        if (data.success) {
            resultDiv.className = 'import-result success';
            resultDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
            showToast(data.message, 'success');
            clearFile();
            document.getElementById('bank-name').value = '';
            loadStats();
        } else {
            resultDiv.className = 'import-result error';
            resultDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${data.error}`;
            showToast(data.error, 'error');
        }
    } catch (error) {
        document.getElementById('import-progress').style.display = 'none';
        showToast('????: ' + error.message, 'error');
    }

    document.getElementById('import-btn').disabled = false;
}

// ==================== ???? ====================
async function loadBanks() {
    try {
        const data = await window.storageService.getBanks();
        
        const bankList = document.getElementById('bank-list');
        
        if (data.success && data.banks.length > 0) {
            bankList.innerHTML = data.banks.map(bank => `
                <div class="bank-card">
                    <div class="bank-info" onclick="browseBank('${bank.name}')">
                        <div class="bank-name">${bank.name}</div>
                        ${bank.semester ? `<div class="bank-semester">${bank.semester}</div>` : ''}
                        <div class="bank-meta">
                            ????: ${bank.import_time} | ???: ${bank.source_file}
                        </div>
                    </div>
                    <div class="bank-stats">
                        <span class="bank-count">${bank.question_count} ?</span>
                        <div class="bank-actions">
                            <button class="btn btn-secondary btn-small" onclick="browseBank('${bank.name}')">
                                <i class="fas fa-eye"></i> ??
                            </button>
                            <button class="btn btn-danger btn-small" onclick="confirmDeleteBank('${bank.name}')">
                                <i class="fas fa-trash"></i> ??
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            bankList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>???????????</p>
                    <button class="btn btn-primary" onclick="switchPage('import')">
                        <i class="fas fa-upload"></i> ????
                    </button>
                </div>
            `;
        }
        
        // ???????
        document.getElementById('question-browser').style.display = 'none';
        document.getElementById('bank-list').style.display = 'grid';
    } catch (error) {
        console.error('????????:', error);
        showToast('????????', 'error');
    }
}

function showBankList() {
    document.getElementById('question-browser').style.display = 'none';
    document.getElementById('bank-list').style.display = 'grid';
}

async function browseBank(bankName) {
    currentBankName = bankName;
    document.getElementById('current-bank-name').textContent = bankName;
    document.getElementById('bank-list').style.display = 'none';
    document.getElementById('question-browser').style.display = 'block';
    
    // ??????
    await loadChapters(bankName);
    
    // ????
    await loadQuestions();
    
    // ??????
    document.getElementById('filter-type').onchange = loadQuestions;
    document.getElementById('filter-chapter').onchange = loadQuestions;
}

async function loadChapters(bankName) {
    try {
        const data = await window.storageService.getChapters(bankName);
        
        const select = document.getElementById('filter-chapter');
        select.innerHTML = '<option value="">????</option>';
        
            if (data.success && Array.isArray(data.chapters)) {
                data.chapters.forEach(chapter => {
                    select.innerHTML += `<option value="${chapter}">${chapter}</option>`;
                });
            } else {
                console.warn('loadPracticeChapters: ??????', data);
            }
    } catch (error) {
        console.error('????????:', error);
    }
}

async function loadQuestions() {
    const type = document.getElementById('filter-type').value;
    const chapter = document.getElementById('filter-chapter').value;
    
    try {
        let data;
        const filters = { bank: currentBankName };
        if (type) filters.type = type;
        if (chapter) filters.chapter = chapter;
        data = await window.storageService.getQuestions(filters);
        
        const questionList = document.getElementById('question-list');
        
        if (data.success && data.questions.length > 0) {
            questionList.innerHTML = data.questions.map((q, index) => {
                const answerSet = new Set(q.answer || []);
                const optionEntries = Object.entries(q.options || {});
                const visibleOptions = isBackMode && answerSet.size > 0
                    ? optionEntries.filter(([key]) => answerSet.has(key))
                    : optionEntries;
                const answerBlock = isBackMode ? '' : `
                    <div class="question-answer">
                        <i class="fas fa-check-circle"></i> ????: ${q.answer.join('')}
                    </div>`;
                const actionBlock = isBackMode ? '' : `
                    <div class="question-actions">
                        <button class="btn btn-secondary btn-small" onclick="editQuestion('${q.id}')">
                            <i class="fas fa-edit"></i> ??
                        </button>
                        <button class="btn btn-danger btn-small" onclick="confirmDeleteQuestion('${q.id}')">
                            <i class="fas fa-trash"></i> ??
                        </button>
                    </div>`;
                return `
                <div class="question-item ${q.type === 'multi' ? 'multi' : ''}">
                    <div class="question-header">
                        <span class="question-type ${q.type === 'multi' ? 'multi' : ''}">
                            ${q.type === 'multi' ? '???' : '???'}
                        </span>
                        <span class="question-id-badge" title="????">#${q.id}</span>
                        <span class="question-chapter">${q.chapter}</span>
                    </div>
                    <div class="question-content">${index + 1}. ${q.question}</div>
                    <div class="question-options">
                        ${visibleOptions.map(([key, value]) => `
                            <div class="option-item">${key}. ${value}</div>
                        `).join('')}
                    </div>
                    ${answerBlock}
                    ${actionBlock}
                </div>`;
            }).join('');
        } else {
            questionList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>???????????</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('??????:', error);
        showToast('??????', 'error');
    }
}

function toggleBackMode(checked) {
    isBackMode = !!checked;
    loadQuestions();
}

function confirmDeleteBank(bankName) {
    showConfirmModal(
        '????',
        `???????"${bankName}"??????????`,
        async () => {
            try {
                const data = await window.storageService.deleteBank(bankName);
                
                if (data.success) {
                    showToast(data.message || '????', 'success');
                    loadBanks();
                    loadStats();
                } else {
                    showToast(data.error || '????', 'error');
                }
            } catch (error) {
                showToast('????: ' + error.message, 'error');
            }
        }
    );
}

function confirmDeleteQuestion(questionId) {
    showConfirmModal(
        '????',
        '???????????????????',
        async () => {
            try {
                const response = await fetch(`${API_BASE}/api/questions/${questionId}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                
                if (data.success) {
                    showToast('?????', 'success');
                    loadQuestions();
                    loadStats();
                } else {
                    showToast(data.error, 'error');
                }
            } catch (error) {
                showToast('????: ' + error.message, 'error');
            }
        }
    );
}

async function editQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE}/api/questions/${questionId}`);
        const data = await response.json();
        
        if (data.success) {
            const q = data.question;
            editingQuestionId = questionId;
            
            document.getElementById('edit-question').value = q.question;
            document.getElementById('edit-type').value = q.type;
            document.getElementById('edit-answer').value = q.answer.join('');

            // ??????????????? A-D?
            const baseKeys = ['A', 'B', 'C', 'D'];
            const keys = Array.from(new Set([...baseKeys, ...Object.keys(q.options || {})])).sort();
            editOptionsState = keys.map(k => ({ key: k, value: q.options[k] || '' }));
            renderEditOptions();
            
            document.getElementById('edit-modal').classList.add('show');
        }
    } catch (error) {
        showToast('??????', 'error');
    }
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('show');
    editingQuestionId = null;
    editOptionsState = [];
}

async function saveQuestion() {
    if (!editingQuestionId) return;
    
    const options = {};
    document.querySelectorAll('#edit-options .option-edit').forEach(row => {
        const key = row.dataset.key;
        const input = row.querySelector('input');
        if (!key || !input) return;
        const value = input.value.trim();
        if (value) {
            options[key] = value;
        }
    });
    
    const updateData = {
        question: document.getElementById('edit-question').value.trim(),
        type: document.getElementById('edit-type').value,
        options: options,
        answer: document.getElementById('edit-answer').value.toUpperCase().split('').filter(ch => options[ch])
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/questions/${editingQuestionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('?????', 'success');
            closeEditModal();
            loadQuestions();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('????: ' + error.message, 'error');
    }
}

// ?????????
function renderEditOptions() {
    const optionsDiv = document.getElementById('edit-options');
    if (!optionsDiv) return;
    optionsDiv.innerHTML = editOptionsState.map(item => `
        <div class="option-edit" data-key="${item.key}">
            <span>${item.key}.</span>
            <input type="text" id="edit-option-${item.key}" value="${item.value || ''}" placeholder="??${item.key}">
            <button class="btn btn-danger btn-small" type="button" onclick="removeEditOption('${item.key}')">??</button>
        </div>
    `).join('');
}

// ?????
function addEditOption() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existing = new Set(editOptionsState.map(o => o.key));
    const next = [...letters].find(ch => !existing.has(ch));
    if (!next) {
        showToast('???????', 'warning');
        return;
    }
    editOptionsState.push({ key: next, value: '' });
    renderEditOptions();
}

// ???????????
function removeEditOption(key) {
    if (editOptionsState.length <= 2) {
        showToast('????????', 'warning');
        return;
    }
    editOptionsState = editOptionsState.filter(o => o.key !== key);
    renderEditOptions();
}

// ==================== ???? ====================
async function loadPracticeOptions() {
    try {
        const data = await window.storageService.getBanks();
        
        const select = document.getElementById('practice-bank');
        select.innerHTML = '<option value="">????</option>';
        
        if (data.success && Array.isArray(data.banks)) {
            data.banks.forEach(bank => {
                select.innerHTML += `<option value="${bank.name}">${bank.name} (${bank.question_count}?)</option>`;
            });
        } else {
            console.warn('loadPracticeOptions: ??????', data);
        }
        
        // ????????
        select.onchange = () => {
            loadPracticeChapters();
            if (currentPracticeMode === 'wrong') {
                updateWrongQuestionStats();
            } else {
                updateAvailableStats();
            }
        };
        
        // ??????
        if (currentPracticeMode === 'wrong') {
            updateWrongQuestionStats();
        } else {
            updateAvailableStats();
        }
    } catch (error) {
        console.error('????????:', error);
    }
}

async function loadPracticeChapters() {
    const bank = document.getElementById('practice-bank').value;
    const select = document.getElementById('practice-chapter');
    select.innerHTML = '<option value="">????</option>';
    
    if (bank) {
        try {
            const data = await window.storageService.getChapters(bank);
            
            if (data.success) {
                data.chapters.forEach(chapter => {
                    select.innerHTML += `<option value="${chapter}">${chapter}</option>`;
                });
            }
        } catch (error) {
            console.error('??????:', error);
        }
    }
    
    select.onchange = function() {
        if (currentPracticeMode === 'wrong') {
            updateWrongQuestionStats();
        } else {
            updateAvailableStats();
        }
    };
}

async function updateAvailableStats() {
    const bank = document.getElementById('practice-bank').value;
    const chapter = document.getElementById('practice-chapter')?.value || '';
    
    try {
        // ??????
        let singleCount = 0;
        let multiCount = 0;
        
        const data = await window.storageService.getQuestions({
            bank: bank,
            chapter: chapter
        });
        
        if (data.success && Array.isArray(data.questions)) {
            data.questions.forEach(q => {
                if (q.type === 'single') singleCount++;
                else multiCount++;
            });
        } else {
            console.warn('updateAvailableStats: ??????', data);
            document.getElementById('available-single').textContent = 0;
            document.getElementById('available-multi').textContent = 0;
        }
        
        document.getElementById('available-single').textContent = singleCount;
        document.getElementById('available-multi').textContent = multiCount;
    } catch (error) {
        console.error('??????:', error);
    }
}

function showPracticeSettings() {
    document.getElementById('practice-settings').style.display = 'flex';
    document.getElementById('practice-area').style.display = 'none';
    document.getElementById('practice-result').style.display = 'none';
    document.getElementById('practice-header-info').style.display = 'none';
    document.getElementById('question-nav-panel').style.display = 'none';
    document.getElementById('practice-title').style.display = 'block';
    
    // ?????
    if (practiceTimer) {
        clearInterval(practiceTimer);
        practiceTimer = null;
    }
    
    // ?????????????
    document.getElementById('ranking-panel-wrapper').classList.remove('collapsed');
}

async function startPractice(examMode = false) {
    const bank = document.getElementById('practice-bank').value;
    const chapter = document.getElementById('practice-chapter')?.value || '';
    const singleCount = parseInt(document.getElementById('practice-single-count').value) || 0;
    const multiCount = parseInt(document.getElementById('practice-multi-count').value) || 0;
    const enableTimer = document.getElementById('enable-timer').checked;
    const timeMinutes = parseInt(document.getElementById('practice-time').value) || 35;
    const shuffleOptionsEnabled = document.getElementById('shuffle-options')?.checked || false;
    
    if (singleCount === 0 && multiCount === 0) {
        showToast('????????????', 'warning');
        return;
    }
    
    // ??????
    lastPracticeSettings = { bank, chapter, singleCount, multiCount, enableTimer, timeMinutes, examMode, shuffleOptionsEnabled, mode: examMode ? 'exam' : 'random' };
    currentPracticeMode = examMode ? 'exam' : 'random';
    
    try {
        const filters = { single_count: singleCount, multi_count: multiCount };
        if (bank) filters.bank = bank;
        if (chapter) filters.chapter = chapter;
        const data = await window.storageService.getPracticeRandom(filters);
        
        if (data.success && data.questions.length > 0) {
            practiceQuestions = data.questions.map(q => {
                if (shuffleOptionsEnabled) {
                    const shuffled = shuffleEntries(Object.entries(q.options || {}), q.answer);
                    return {
                        ...q,
                        shuffledOptions: shuffled.entries,
                        shuffledAnswer: shuffled.shuffledAnswer,
                        reverseAnswerMap: shuffled.reverseAnswerMap
                    };
                }
                return { ...q, shuffledOptions: null, shuffledAnswer: null, reverseAnswerMap: null };
            });
            currentQuestionIndex = 0;
            correctCount = 0;
            wrongCount = 0;
            selectedAnswers = [];
            practiceStartTime = new Date();
            isExamMode = examMode;
            navCurrentPage = 1; // ???????
            
            // ???????????????
            currentProgressId = null;
            loadedElapsedTime = 0;
            
            // ???????????
            questionResults = practiceQuestions.map(() => ({
                answered: false,
                userAnswer: [],
                correctAnswer: [],
                isCorrect: null
            }));
            
            document.getElementById('practice-settings').style.display = 'none';
            document.getElementById('practice-area').style.display = 'block';
            document.getElementById('practice-result').style.display = 'none';
            document.getElementById('practice-header-info').style.display = 'flex';
            document.getElementById('practice-title').style.display = 'none';
            
            // ????????
            const navPanel = document.getElementById('question-nav-panel');
            navPanel.style.display = 'block';
            navPanel.classList.remove('collapsed');
            navPanel.classList.add('expanded');
            
            // ????????????
            document.getElementById('ranking-panel-wrapper').classList.add('collapsed');
            
            // ??????
            const modeBadge = document.getElementById('practice-mode-badge');
            if (isExamMode) {
                modeBadge.textContent = '????';
                modeBadge.className = 'practice-mode-badge exam';
                document.getElementById('score-info').style.display = 'none';
            } else {
                modeBadge.textContent = '????';
                modeBadge.className = 'practice-mode-badge practice';
                document.getElementById('score-info').style.display = 'flex';
            }
            
            // ?????
            renderQuestionNav();
            
            // ????????????
            if (practiceTimer) {
                clearInterval(practiceTimer);
                practiceTimer = null;
            }
            if (enableTimer) {
                remainingTime = timeMinutes * 60;
                document.getElementById('timer-display').style.display = 'flex';
                updateTimerDisplay();
                practiceTimer = setInterval(updateTimer, 1000);
            } else {
                document.getElementById('timer-display').style.display = 'none';
            }
            
            renderQuestion();
        } else {
            showToast('?????????????????', 'warning');
        }
    } catch (error) {
        showToast('??????: ' + error.message, 'error');
    }
}

// ?????????
function restartWithSameSettings() {
    if (lastPracticeSettings) {
        document.getElementById('practice-bank').value = lastPracticeSettings.bank || '';
        if (document.getElementById('practice-chapter')) {
            document.getElementById('practice-chapter').value = lastPracticeSettings.chapter || '';
        }
        document.getElementById('practice-single-count').value = lastPracticeSettings.singleCount || 0;
        document.getElementById('practice-multi-count').value = lastPracticeSettings.multiCount || 0;
        document.getElementById('enable-timer').checked = lastPracticeSettings.enableTimer;
        document.getElementById('practice-time').value = lastPracticeSettings.timeMinutes || 30;
        if (document.getElementById('shuffle-options')) {
            document.getElementById('shuffle-options').checked = lastPracticeSettings.shuffleOptionsEnabled;
        }
        if (document.getElementById('practice-mode')) {
            document.getElementById('practice-mode').value = lastPracticeSettings.mode || 'random';
        }
        
        // ?????????
        const mode = lastPracticeSettings.mode || 'random';
        switch (mode) {
            case 'random':
                startPractice(false);
                break;
            case 'exam':
                startPractice(true);
                break;
            case 'sequence':
                startSequencePractice();
                break;
            case 'wrong':
                startWrongPractice();
                break;
            default:
                startPractice(lastPracticeSettings.examMode);
        }
    } else {
        showPracticeSettings();
    }
}

// ?????????????????????????
function renderQuestionNav() {
    const grid = document.getElementById('question-nav-grid');
    
    // ????????
    const singleQuestions = [];
    const multiQuestions = [];
    practiceQuestions.forEach((q, i) => {
        if (q.type === 'multi') {
            multiQuestions.push({ index: i, question: q });
        } else {
            singleQuestions.push({ index: i, question: q });
        }
    });
    
    // ??????????
    const allItems = [...singleQuestions, ...multiQuestions];
    const totalPages = Math.ceil(allItems.length / NAV_PAGE_SIZE);
    
    // ????????
    if (navCurrentPage < 1) navCurrentPage = 1;
    if (navCurrentPage > totalPages) navCurrentPage = totalPages;
    if (totalPages === 0) navCurrentPage = 1;
    
    // ????????????????????????
    if (!manualNavPageChange) {
        const currentItemIndex = allItems.findIndex(item => item.index === currentQuestionIndex);
        if (currentItemIndex >= 0) {
            const targetPage = Math.floor(currentItemIndex / NAV_PAGE_SIZE) + 1;
            if (targetPage !== navCurrentPage) {
                navCurrentPage = targetPage;
            }
        }
    }
    
    // ??????????
    const startIdx = (navCurrentPage - 1) * NAV_PAGE_SIZE;
    const endIdx = Math.min(startIdx + NAV_PAGE_SIZE, allItems.length);
    const pageItems = allItems.slice(startIdx, endIdx);
    
    let html = '';
    
    // ???????????
    if (totalPages > 1) {
        html += '<div class="nav-pagination">';
        html += `<button class="nav-page-btn ${navCurrentPage <= 1 ? 'disabled' : ''}" onclick="changeNavPage(${navCurrentPage - 1})" ${navCurrentPage <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
        
        // ????
        for (let p = 1; p <= totalPages; p++) {
            const active = p === navCurrentPage ? 'active' : '';
            html += `<button class="nav-page-num ${active}" onclick="changeNavPage(${p})">${p}</button>`;
        }
        
        html += `<button class="nav-page-btn ${navCurrentPage >= totalPages ? 'disabled' : ''}" onclick="changeNavPage(${navCurrentPage + 1})" ${navCurrentPage >= totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        html += '</div>';
    }
    
    // ??????????????
    let currentSection = null;
    
    pageItems.forEach((item) => {
        const itemType = item.question.type === 'multi' ? 'multi' : 'single';
        
        // ????????????
        if (currentSection !== itemType) {
            // ???????
            if (currentSection !== null) {
                html += '</div></div>';
            }
            
            // ?????
            currentSection = itemType;
            const totalCount = itemType === 'multi' ? multiQuestions.length : singleQuestions.length;
            const title = itemType === 'multi' ? '???' : '???';
            html += `<div class="nav-section"><div class="nav-section-title ${itemType === 'multi' ? 'multi' : ''}">${title} (${totalCount}?)</div>`;
            html += '<div class="nav-section-grid">';
        }
        
        const result = questionResults[item.index];
        let statusClass = '';
        if (result?.answered) {
            // ?????
            if (isExamMode) {
                // ????????????????
                statusClass = 'answered';
            } else if (result.isCorrect === true) {
                statusClass = 'answered correct';
            } else if (result.isCorrect === false) {
                statusClass = 'answered wrong';
            } else {
                statusClass = 'answered';
            }
        } else if (result?.userAnswer?.length > 0) {
            // ???????????
            statusClass = 'selected';
        }
        const current = item.index === currentQuestionIndex ? 'current' : '';
        const multiClass = item.question.type === 'multi' ? 'multi' : '';
        html += `<button class="nav-btn ${multiClass} ${statusClass} ${current}" onclick="goToQuestion(${item.index})">${item.index + 1}</button>`;
    });
    
    // ????????
    if (currentSection !== null) {
        html += '</div></div>';
    }
    
    grid.innerHTML = html;
    
    // ??????
    const answeredCount = questionResults.filter(r => r.answered).length;
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('nav-total').textContent = practiceQuestions.length;
}

// ???????
let manualNavPageChange = false; // ???????????

function changeNavPage(page) {
    const allCount = practiceQuestions.length;
    const totalPages = Math.ceil(allCount / NAV_PAGE_SIZE);
    
    if (page >= 1 && page <= totalPages) {
        navCurrentPage = page;
        manualNavPageChange = true; // ???????
        renderQuestionNav();
        manualNavPageChange = false; // ???????
    }
}

// ???????
function goToQuestion(index) {
    if (index >= 0 && index < practiceQuestions.length) {
        currentQuestionIndex = index;
        renderQuestion();
        renderQuestionNav();
    }
}

function updateTimer() {
    remainingTime--;
    updateTimerDisplay();
    
    if (remainingTime <= 0) {
        clearInterval(practiceTimer);
        practiceTimer = null;
        showToast('????', 'warning');
        showPracticeResult();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer-text').textContent = display;
    
    // ????5?????
    const timerDisplay = document.getElementById('timer-display');
    if (remainingTime <= 300) {
        timerDisplay.classList.add('warning');
    } else {
        timerDisplay.classList.remove('warning');
    }
}

function applyAdaptiveTextSize(el) {
    if (!el) return;
    var classes = ['text-sm', 'text-xs', 'text-xxs', 'text-micro'];
    for (var i = 0; i < classes.length; i++) {
        el.classList.remove(classes[i]);
    }
    var len = (el.textContent || '').length;
    if (len > 300) {
        el.classList.add('text-micro');
    } else if (len > 180) {
        el.classList.add('text-xxs');
    } else if (len > 100) {
        el.classList.add('text-xs');
    } else if (len > 50) {
        el.classList.add('text-sm');
    }
}

function applyAdaptiveOptionText(el) {
    if (!el) return;
    var classes = ['text-sm', 'text-xs', 'text-xxs'];
    for (var i = 0; i < classes.length; i++) {
        el.classList.remove(classes[i]);
    }
    var len = (el.textContent || '').length;
    if (len > 60) {
        el.classList.add('text-xxs');
    } else if (len > 35) {
        el.classList.add('text-xs');
    } else if (len > 18) {
        el.classList.add('text-sm');
    }
}

function renderQuestion() {
    const question = practiceQuestions[currentQuestionIndex];
    const result = questionResults[currentQuestionIndex];
    
    // ????
    document.getElementById('current-index').textContent = currentQuestionIndex + 1;
    document.getElementById('total-count').textContent = practiceQuestions.length;
    document.getElementById('correct-num').textContent = correctCount;
    document.getElementById('wrong-num').textContent = wrongCount;
    
    // ????
    document.getElementById('question-type').textContent = question.type === 'multi' ? '???' : '???';
    document.getElementById('question-type').className = `question-type ${question.type === 'multi' ? 'multi' : ''}`;
    document.getElementById('question-id').textContent = `#${question.id}`;
    document.getElementById('question-chapter').textContent = question.chapter;
    
    // ??????????????
    const contentEl = document.getElementById('question-content');
    contentEl.textContent = question.question;
    applyAdaptiveTextSize(contentEl);
    
    // ????
    const optionsList = document.getElementById('options-list');
    const optionEntries = question.shuffledOptions || Object.entries(question.options);
    
    // ???????????????????
    if (isExamMode) {
        // ??????
        selectedAnswers = result.answered ? [...result.userAnswer] : [];
        
        optionsList.innerHTML = optionEntries.map(([key, value]) => {
            const isSelected = selectedAnswers.includes(key) ? 'selected' : '';
            return `<button class="option-btn ${isSelected}" onclick="selectOption('${key}', ${question.type === 'multi'})" data-key="${key}">
                <span class="option-key">${key}</span>
                <span class="option-text">${value}</span>
            </button>`;
        }).join('');
        
        document.getElementById('answer-result').style.display = 'none';
        document.getElementById('submit-btn').style.display = 'none'; // ???????????
        document.getElementById('next-btn').style.display = 'inline-flex';
        
        if (currentQuestionIndex === practiceQuestions.length - 1) {
            document.getElementById('next-btn').innerHTML = '???? <i class="fas fa-paper-plane"></i>';
        } else {
            document.getElementById('next-btn').innerHTML = '??? <i class="fas fa-arrow-right"></i>';
        }
    } else if (result.answered) {
        // ??????????????
        optionsList.innerHTML = optionEntries.map(([key, value]) => {
            const isCorrect = result.correctAnswer.includes(key) ? 'correct' : '';
            const isWrong = result.userAnswer.includes(key) && !result.correctAnswer.includes(key) ? 'wrong' : '';
            const isSelected = result.userAnswer.includes(key) ? 'selected' : '';
            return `<button class="option-btn ${isCorrect} ${isWrong} ${isSelected} disabled" data-key="${key}">
                <span class="option-key">${key}</span>
                <span class="option-text">${value}</span>
            </button>`;
        }).join('');
        
        // ????????????????????
        const resultDiv = document.getElementById('answer-result');
        resultDiv.style.display = 'none';
        
        // ????????????
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'inline-flex';
        
        // ?????????
        if (currentQuestionIndex === practiceQuestions.length - 1) {
            document.getElementById('next-btn').innerHTML = '???? <i class="fas fa-flag-checkered"></i>';
        } else {
            document.getElementById('next-btn').innerHTML = '??? <i class="fas fa-arrow-right"></i>';
        }
    } else {
        // ????????????
        optionsList.innerHTML = optionEntries.map(([key, value]) => `
            <button class="option-btn" onclick="selectOption('${key}', ${question.type === 'multi'})" data-key="${key}">
                <span class="option-key">${key}</span>
                <span class="option-text">${value}</span>
            </button>
        `).join('');
        
        // ????
        selectedAnswers = [];
        document.getElementById('answer-result').style.display = 'none';
        document.getElementById('submit-btn').style.display = 'inline-flex';
        document.getElementById('next-btn').style.display = 'none';
    }
    
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    
    var optionTextEls = document.querySelectorAll('.option-text');
    for (var i = 0; i < optionTextEls.length; i++) {
        applyAdaptiveOptionText(optionTextEls[i]);
    }
    
    // ??????
    renderQuestionNav();
}

function selectOption(key, isMulti) {
    const btn = document.querySelector(`.option-btn[data-key="${key}"]`);
    
    if (btn.classList.contains('disabled')) return;
    
    if (isMulti) {
        // ???
        if (selectedAnswers.includes(key)) {
            selectedAnswers = selectedAnswers.filter(k => k !== key);
            btn.classList.remove('selected');
        } else {
            selectedAnswers.push(key);
            btn.classList.add('selected');
        }
    } else {
        // ???
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAnswers = [key];
    }
    
    // ?????????????????????
    if (isExamMode && selectedAnswers.length > 0) {
        saveExamAnswer();
    }
}

// ????????????????
function saveExamAnswer() {
    if (!isExamMode) return;
    const question = practiceQuestions[currentQuestionIndex];
    // ?????????????
    const correctAnswer = question.shuffledAnswer || question.answer || [];
    questionResults[currentQuestionIndex] = {
        answered: true,
        userAnswer: [...selectedAnswers],
        correctAnswer: correctAnswer,
        isCorrect: null  // ????
    };
    renderQuestionNav();
}

// ???????????????ABCD?????????????
function shuffleEntries(entries, originalAnswer) {
    const keys = entries.map(([key]) => key).sort(); // ?????? A, B, C, D...
    const values = entries.map(([, value]) => value);
    const originalKeys = entries.map(([key]) => key).sort();
    
    // ????????????
    const valueToOriginalKey = {};
    entries.forEach(([key, value]) => {
        valueToOriginalKey[value] = key;
    });
    
    // ????
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    
    // ?????????????????????
    const newEntries = keys.map((key, idx) => [key, values[idx]]);
    
    // ????????????? -> ?????
    // ????D??????D??????A??????????A
    const answerMap = {};
    const reverseAnswerMap = {}; // ??? -> ???????????????????
    newEntries.forEach(([newKey, value]) => {
        const originalKey = valueToOriginalKey[value];
        if (originalKey) {
            answerMap[originalKey] = newKey;
            reverseAnswerMap[newKey] = originalKey;
        }
    });
    
    // ??????
    const shuffledAnswer = (originalAnswer || []).map(ans => answerMap[ans] || ans);
    
    return {
        entries: newEntries,
        shuffledAnswer: shuffledAnswer,
        reverseAnswerMap: reverseAnswerMap // ??????
    };
}

async function submitAnswer() {
    if (selectedAnswers.length === 0) {
        showToast('?????', 'warning');
        return;
    }
    
    const question = practiceQuestions[currentQuestionIndex];
    
    // ??????????????????????
    const correctAnswer = question.shuffledAnswer || question.answer || [];
    
    // ???????????
    const isCorrect = arraysEqual([...selectedAnswers].sort(), [...correctAnswer].sort());
    
    // ??????
    questionResults[currentQuestionIndex] = {
        answered: true,
        userAnswer: [...selectedAnswers],
        correctAnswer: correctAnswer,
        isCorrect: isCorrect
    };
    
    // ???????????????????????calculateExamResults??????
    if (!isCorrect && !isExamMode) {
        addToWrongbook(question, selectedAnswers);
    }
    
    if (isExamMode) {
        // ??????????????????
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.add('disabled');
        });
        
        // ????
        renderQuestionNav();
        
        // ????
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'inline-flex';
        
        if (currentQuestionIndex === practiceQuestions.length - 1) {
            document.getElementById('next-btn').innerHTML = '???? <i class="fas fa-paper-plane"></i>';
        } else {
            document.getElementById('next-btn').innerHTML = '??? <i class="fas fa-arrow-right"></i>';
        }
    } else {
        // ?????????
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.add('disabled');
            const key = btn.dataset.key;
            
            if (correctAnswer.includes(key)) {
                btn.classList.add('correct');
            } else if (selectedAnswers.includes(key)) {
                btn.classList.add('wrong');
            }
        });
        
        // ????????????????????
        const resultDiv = document.getElementById('answer-result');
        resultDiv.style.display = 'none';
        
        if (isCorrect) {
            correctCount++;
        } else {
            wrongCount++;
        }
        
        // ????
        document.getElementById('correct-num').textContent = correctCount;
        document.getElementById('wrong-num').textContent = wrongCount;
        
        // ????
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'inline-flex';
        
        // ???????
        if (currentQuestionIndex === practiceQuestions.length - 1) {
            document.getElementById('next-btn').innerHTML = '???? <i class="fas fa-flag-checkered"></i>';
        }
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        // ????
        if (isExamMode) {
            // ?????????????????????????????
            calculateExamResults().then(() => {
                showPracticeResult();
            });
        } else {
            showPracticeResult();
        }
    }
}

// ???????? - ????
async function calculateExamResults() {
    correctCount = 0;
    wrongCount = 0;
    
    // ??????
    const wrongQuestions = [];
    
    questionResults.forEach((result, index) => {
        const question = practiceQuestions[index];
        // ??????????????????????
        const correctAnswer = question.shuffledAnswer || question.answer || [];
        
        if (result.answered && result.userAnswer.length > 0) {
            // ????????
            const isCorrect = arraysEqual(result.userAnswer.sort(), correctAnswer.sort());
            result.isCorrect = isCorrect;
            result.correctAnswer = correctAnswer;
            
            if (isCorrect) {
                correctCount++;
            } else {
                wrongCount++;
                // ???????????
                wrongQuestions.push({ question, userAnswer: result.userAnswer });
            }
        } else {
            // ?????
            result.isCorrect = false;
            result.correctAnswer = correctAnswer;
            wrongCount++;
        }
    });
    
    // ???????????????????
    for (const { question, userAnswer } of wrongQuestions) {
        await addToWrongbook(question, userAnswer);
    }
}

// ???????????????
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function showPracticeResult() {
    // ?????
    if (practiceTimer) {
        clearInterval(practiceTimer);
        practiceTimer = null;
    }
    
    // ??????????? + ???????
    const endTime = new Date();
    const currentSessionTime = Math.floor((endTime - practiceStartTime) / 1000); // ?
    const totalTimeSpent = loadedElapsedTime + currentSessionTime;
    const minutes = Math.floor(totalTimeSpent / 60);
    const seconds = totalTimeSpent % 60;
    const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('practice-area').style.display = 'none';
    document.getElementById('practice-result').style.display = 'block';
    document.getElementById('practice-header-info').style.display = 'none';
    document.getElementById('question-nav-panel').style.display = 'none';
    
    const total = practiceQuestions.length;
    const rate = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    document.getElementById('result-total').textContent = total;
    document.getElementById('result-correct').textContent = correctCount;
    document.getElementById('result-wrong').textContent = wrongCount;
    document.getElementById('result-rate').textContent = rate + '%';
    document.getElementById('result-time').textContent = timeDisplay;
    
    // ????????????
    if (currentProgressId) {
        deleteProgress(currentProgressId, true);
        currentProgressId = null;
    }
    
    // ??????
    loadedElapsedTime = 0;
    
    // ????????
    renderResultNav();
    // ???????
    showResultQuestion(0);
    
    // ???????
    const playerName = document.getElementById('player-name')?.value?.trim() || '??';
    saveRanking({
        name: playerName,
        total: total,
        correct: correctCount,
        wrong: wrongCount,
        accuracy: rate,
        time_spent: totalTimeSpent,
        time_display: timeDisplay
    });
}

// ?????????
function renderResultNav() {
    const grid = document.getElementById('result-nav-grid');
    
    grid.innerHTML = practiceQuestions.map((_, i) => {
        const num = i + 1;
        const result = questionResults[i];
        const status = result.answered ? (result.isCorrect ? 'correct' : 'wrong') : 'wrong';
        return `<button class="result-nav-btn ${status}" onclick="showResultQuestion(${i})" data-index="${i}">${num}</button>`;
    }).join('');
}

// ????????????
function showResultQuestion(index) {
    const question = practiceQuestions[index];
    const result = questionResults[index];
    const detailDiv = document.getElementById('result-question-detail');
    
    // ????????
    document.querySelectorAll('.result-nav-btn').forEach((btn, i) => {
        btn.classList.toggle('current', i === index);
    });
    
    const typeText = question.type === 'multi' ? '???' : '???';
    const statusClass = result.answered ? (result.isCorrect ? 'correct' : 'wrong') : 'wrong';
    const statusText = result.answered ? (result.isCorrect ? '? ??' : '? ??') : '? ???';
    
    // ????????????????????????
    const optionEntries = question.shuffledOptions || Object.entries(question.options);
    
    let optionsHtml = optionEntries.map(([key, value]) => {
        const classes = [];
        const isUserSelected = result.userAnswer.includes(key);
        const isCorrectAnswer = result.correctAnswer.includes(key);
        
        if (isCorrectAnswer) {
            classes.push('correct-answer');
        }
        if (isUserSelected && !isCorrectAnswer) {
            classes.push('wrong-answer');
        }
        if (isUserSelected) {
            classes.push('user-selected');
        }
        
        return `<div class="result-option ${classes.join(' ')}">
            <span class="result-option-key">${key}</span>
            <span class="result-option-text">${value}</span>
        </div>`;
    }).join('');
    
    const userAnswerText = result.userAnswer.length > 0 ? result.userAnswer.join('') : '???';
    const correctAnswerText = result.correctAnswer.join('');
    
    detailDiv.innerHTML = `
        <div class="result-question-header">
            <span class="question-type ${question.type === 'multi' ? 'multi' : ''}">${typeText}</span>
            <span class="result-question-status ${statusClass}">${statusText}</span>
            <span class="question-chapter">${question.chapter}</span>
        </div>
        <div class="result-question-content">${index + 1}. ${question.question}</div>
        <div class="result-options-list">${optionsHtml}</div>
        <div class="result-answer-info">
            <span class="your-answer"><i class="fas fa-user"></i> ????: ${userAnswerText}</span>
            <span class="correct-answer"><i class="fas fa-check"></i> ????: ${correctAnswerText}</span>
        </div>
    `;
}

// ==================== ?? ====================
async function loadConfig() {
    try {
        const data = await window.storageService.getConfig();

        if (data.success) {
            document.getElementById('data-path').value = data.config.data_path || '';
            document.getElementById('current-data-file').textContent =
                (data.config.data_path || '') + '/' + (data.config.questions_file || '');
        }
    } catch (error) {
        console.error('??????:', error);
    }
}

async function saveSettings() {
    const dataPath = document.getElementById('data-path').value.trim();
    
    if (!dataPath) {
        showToast('?????????', 'warning');
        return;
    }
    
    try {
        const configData = {
            data_path: dataPath,
            questions_file: 'questions.json'
        };

        const data = await window.storageService.saveConfig(configData);
        
        if (data.success) {
            showToast('?????', 'success');
            loadConfig();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('??????: ' + error.message, 'error');
    }
}

function clearAllData() {
    showConfirmModal(
        '??????',
        '?????????????????????',
        async () => {
            try {
                // ?????????
                const response = await fetch(`${API_BASE}/api/banks`);
                const data = await response.json();
                
                if (data.success) {
                    for (const bank of data.banks) {
                        await fetch(`${API_BASE}/api/banks/${encodeURIComponent(bank.name)}`, {
                            method: 'DELETE'
                        });
                    }
                    showToast('???????', 'success');
                    loadStats();
                }
            } catch (error) {
                showToast('??????: ' + error.message, 'error');
            }
        }
    );
}

function confirmClearCache() {
    showConfirmModal(
        '??????',
        '?????????????????????????????????????????',
        () => {
            showConfirmModal(
                '????',
                '?????????????????????',
                async () => {
                    try {
                        await window.storageService.clearAllCacheData();
                        localStorage.removeItem('quiz_rankings');
                        localStorage.removeItem('quiz_wrongbook');
                        localStorage.removeItem('quiz_progress');
                        localStorage.removeItem('quiz_player_name');
                        localStorage.removeItem('mobileMenuBtnPos');
                        showToast('???????', 'success');
                        loadStats();
                        loadBankChapters();
                    } catch (error) {
                        showToast('??????: ' + error.message, 'error');
                    }
                }
            );
        }
    );
}

// ==================== ???? ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-modal').classList.add('show');
    
    document.getElementById('confirm-btn').onclick = () => {
        closeModal();
        onConfirm();
    };
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('show');
}

function browseDataPath() {
    showToast('????????????', 'warning');
}

// ==================== ???? ====================
async function loadRankings() {
    try {
        const data = await window.storageService.getRankings();
        
        if (data && data.success) {
            renderRankings(data.rankings);
        }
    } catch (error) {
        console.error('??????:', error);
    }
}

function renderRankings(rankings) {
    const container = document.getElementById('ranking-list');
    if (!container) return;
    
    if (!rankings || rankings.length === 0) {
        container.innerHTML = '<div class="empty-ranking">????</div>';
        return;
    }
    
    // ????????????????????????
    rankings.sort((a, b) => {
        if (b.accuracy !== a.accuracy) {
            return b.accuracy - a.accuracy;
        }
        return a.time_spent - b.time_spent;
    });
    
    const html = rankings.slice(0, 20).map((item, index) => {
        const rankClass = index < 3 ? `top-${index + 1}` : '';
        const name = item.name || '??';
        const correct = item.correct || 0;
        const total = item.total || 0;
        const timeDisplay = item.time_display || '00:00';
        const accuracy = item.accuracy || 0;
        
        return `
            <div class="ranking-item ${rankClass}">
                <div class="ranking-rank">${index + 1}</div>
                <div class="ranking-info">
                    <span class="ranking-name">${escapeHtml(name)}</span>
                    <span class="ranking-meta">${correct}/${total} ? ${timeDisplay}</span>
                </div>
                <div class="ranking-accuracy">${accuracy}%</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function saveRanking(record) {
    try {
        const data = await window.storageService.saveRanking(record);
        
        if (data.success) {
            loadRankings();
        }
    } catch (error) {
        console.error('??????:', error);
    }
}

async function clearRankings() {
    showConfirmModal(
        '????',
        '?????????????????????',
        async () => {
            try {
                const data = await window.storageService.clearRankings();
                
                if (data.success) {
                    showToast('?????', 'success');
                    loadRankings();
                } else {
                    showToast('????: ' + (data.error || data.message), 'error');
                }
            } catch (error) {
                showToast('????: ' + error.message, 'error');
            }
        }
    );
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== ?????? ====================
function onPracticeModeChange() {
    const mode = document.getElementById('practice-mode').value;
    currentPracticeMode = mode;
    
    const shuffleQuestionsRow = document.getElementById('shuffle-questions-row');
    const startBtn = document.getElementById('start-practice-btn');
    const singleCountInput = document.getElementById('practice-single-count');
    const multiCountInput = document.getElementById('practice-multi-count');
    
    // ??????????????
    if (shuffleQuestionsRow) {
        shuffleQuestionsRow.style.display = mode === 'sequence' ? 'block' : 'none';
    }
    
    // ??????
    const modeNames = {
        'random': '????',
        'exam': '????',
        'sequence': '????',
        'wrong': '????'
    };
    startBtn.innerHTML = `<i class="fas fa-play"></i> ${modeNames[mode] || '??'}`;
    
    // ???????????
    if (mode === 'wrong') {
        updateWrongQuestionStats();
    } else {
        updateAvailableStats();
    }

    var statsTitle = document.querySelector('#stats-preview h3');
    if (statsTitle) {
        statsTitle.textContent = mode === 'wrong' ? '????' : '????';
    }
}

// ????????
async function updateWrongQuestionStats() {
    try {
        const bank = document.getElementById('practice-bank').value;
        
        const data = await window.storageService.getWrongbookStats();
        
        if (data.success) {
            let singleCount = 0;
            let multiCount = 0;
            
            if (bank) {
                const bankStats = data.stats[bank];
                if (bankStats) {
                    singleCount = bankStats.single || 0;
                    multiCount = bankStats.multi || 0;
                }
            } else {
                Object.values(data.stats).forEach(stat => {
                    singleCount += stat.single || 0;
                    multiCount += stat.multi || 0;
                });
            }
            
            document.getElementById('available-single').textContent = singleCount;
            document.getElementById('available-multi').textContent = multiCount;
        }
    } catch (error) {
        console.error('????????:', error);
    }
}

// ????????
function startPracticeByMode() {
    const mode = document.getElementById('practice-mode').value;
    currentPracticeMode = mode;
    
    switch (mode) {
        case 'random':
            startPractice(false);
            break;
        case 'exam':
            startPractice(true);
            break;
        case 'sequence':
            startSequencePractice();
            break;
        case 'wrong':
            startWrongPractice();
            break;
        default:
            startPractice(false);
    }
}

// ??????
async function startSequencePractice() {
    const bank = document.getElementById('practice-bank').value;
    const chapter = document.getElementById('practice-chapter')?.value || '';
    const shuffleQuestions = document.getElementById('shuffle-questions')?.checked || false;
    const shuffleOptionsEnabled = document.getElementById('shuffle-options')?.checked || false;
    const enableTimer = document.getElementById('enable-timer').checked;
    const timeMinutes = parseInt(document.getElementById('practice-time').value) || 30;
    
    if (!bank) {
        showToast('???????????', 'warning');
        return;
    }
    
    try {
        const filters = { bank };
        if (chapter) filters.chapter = chapter;
        if (shuffleQuestions) filters.shuffle = true;
        
        const data = await window.storageService.getPracticeSequence(filters);
        
        if (data.success && data.questions.length > 0) {
            practiceQuestions = data.questions.map(q => {
                if (shuffleOptionsEnabled) {
                    const shuffled = shuffleEntries(Object.entries(q.options || {}), q.answer);
                    return {
                        ...q,
                        shuffledOptions: shuffled.entries,
                        shuffledAnswer: shuffled.shuffledAnswer,
                        reverseAnswerMap: shuffled.reverseAnswerMap
                    };
                }
                return { ...q, shuffledOptions: null, shuffledAnswer: null, reverseAnswerMap: null };
            });
            
            lastPracticeSettings = { 
                bank, chapter, 
                singleCount: 0, multiCount: 0, 
                enableTimer, timeMinutes, 
                examMode: false, shuffleOptionsEnabled,
                mode: 'sequence', shuffleQuestions
            };
            
            initPracticeSession(enableTimer, timeMinutes, false);
        } else {
            showToast('???????????', 'warning');
        }
    } catch (error) {
        showToast('??????: ' + error.message, 'error');
    }
}

// ??????
async function startWrongPractice() {
    const bank = document.getElementById('practice-bank').value;
    const singleCount = parseInt(document.getElementById('practice-single-count').value) || 0;
    const multiCount = parseInt(document.getElementById('practice-multi-count').value) || 0;
    const shuffleOptionsEnabled = document.getElementById('shuffle-options')?.checked || false;
    const enableTimer = document.getElementById('enable-timer').checked;
    const timeMinutes = parseInt(document.getElementById('practice-time').value) || 30;
    
    if (singleCount === 0 && multiCount === 0) {
        showToast('????????????', 'warning');
        return;
    }
    
    try {
        const filters = { single_count: singleCount, multi_count: multiCount };
        if (bank) filters.bank = bank;
        
        const data = await window.storageService.getPracticeWrong(filters);
        
        if (data.success && data.questions.length > 0) {
            practiceQuestions = data.questions.map(q => {
                if (shuffleOptionsEnabled) {
                    const shuffled = shuffleEntries(Object.entries(q.options || {}), q.answer);
                    return {
                        ...q,
                        shuffledOptions: shuffled.entries,
                        shuffledAnswer: shuffled.shuffledAnswer,
                        reverseAnswerMap: shuffled.reverseAnswerMap
                    };
                }
                return { ...q, shuffledOptions: null, shuffledAnswer: null, reverseAnswerMap: null };
            });
            
            lastPracticeSettings = { 
                bank, chapter: '', 
                singleCount, multiCount, 
                enableTimer, timeMinutes, 
                examMode: false, shuffleOptionsEnabled,
                mode: 'wrong'
            };
            
            initPracticeSession(enableTimer, timeMinutes, false);
        } else {
            showToast('?????????????', 'warning');
        }
    } catch (error) {
        showToast('??????: ' + error.message, 'error');
    }
}

// ?????????????
function initPracticeSession(enableTimer, timeMinutes, examMode) {
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    selectedAnswers = [];
    practiceStartTime = new Date();
    isExamMode = examMode;
    navCurrentPage = 1; // ???????
    
    // ???????????????
    currentProgressId = null;
    loadedElapsedTime = 0;
    
    questionResults = practiceQuestions.map(() => ({
        answered: false,
        userAnswer: [],
        correctAnswer: [],
        isCorrect: null
    }));
    
    document.getElementById('practice-settings').style.display = 'none';
    document.getElementById('practice-area').style.display = 'block';
    document.getElementById('practice-result').style.display = 'none';
    document.getElementById('practice-header-info').style.display = 'flex';
    
    // ????????
    const navPanel = document.getElementById('question-nav-panel');
    navPanel.style.display = 'block';
    navPanel.classList.remove('collapsed'); // ?????????
    
    // ????????????
    document.getElementById('ranking-panel-wrapper').classList.add('collapsed');
    
    // ??????
    const modeBadge = document.getElementById('practice-mode-badge');
    const modeTexts = {
        'random': '????',
        'exam': '????',
        'sequence': '????',
        'wrong': '????'
    };
    modeBadge.textContent = modeTexts[currentPracticeMode] || '????';
    modeBadge.className = `practice-mode-badge ${currentPracticeMode}`;
    
    if (isExamMode) {
        document.getElementById('score-info').style.display = 'none';
    } else {
        document.getElementById('score-info').style.display = 'flex';
    }
    
    renderQuestionNav();
    
    // ????????????
    if (practiceTimer) {
        clearInterval(practiceTimer);
        practiceTimer = null;
    }
    if (enableTimer) {
        remainingTime = timeMinutes * 60;
        document.getElementById('timer-display').style.display = 'flex';
        updateTimerDisplay();
        practiceTimer = setInterval(updateTimer, 1000);
    } else {
        document.getElementById('timer-display').style.display = 'none';
    }
    
    renderQuestion();
}

// ==================== ????? ====================
async function loadWrongBanks() {
    try {
        const data = await window.storageService.getWrongbookStats();
        
        const bankList = document.getElementById('wrong-bank-list');
        
        if (data.success && Object.keys(data.stats).length > 0) {
            bankList.innerHTML = Object.entries(data.stats).map(([bankName, stats]) => `
                <div class="bank-card">
                    <div class="bank-info" onclick="browseWrongBank('${bankName}')">
                        <div class="bank-name">${bankName}</div>
                        <div class="bank-meta">
                            ??: ${stats.single}? | ??: ${stats.multi}?
                        </div>
                    </div>
                    <div class="bank-stats">
                        <span class="bank-count wrong-count-badge">${stats.total} ???</span>
                        <div class="bank-actions">
                            <button class="btn btn-secondary btn-small" onclick="browseWrongBank('${bankName}')">
                                <i class="fas fa-eye"></i> ??
                            </button>
                            <button class="btn btn-danger btn-small" onclick="confirmClearWrongBank('${bankName}')">
                                <i class="fas fa-trash"></i> ??
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            bankList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-smile"></i>
                    <p>???????????</p>
                </div>
            `;
        }
        
        document.getElementById('wrong-question-browser').style.display = 'none';
        document.getElementById('wrong-bank-list').style.display = 'grid';
    } catch (error) {
        console.error('???????:', error);
        showToast('???????', 'error');
    }
}

function showWrongBankList() {
    document.getElementById('wrong-question-browser').style.display = 'none';
    document.getElementById('wrong-bank-list').style.display = 'grid';
}

async function browseWrongBank(bankName) {
    currentWrongBankName = bankName;
    document.getElementById('wrong-current-bank-name').textContent = bankName + ' - ??';
    document.getElementById('wrong-bank-list').style.display = 'none';
    document.getElementById('wrong-question-browser').style.display = 'block';
    
    await loadWrongQuestions(bankName);
}

async function loadWrongQuestions(bankName) {
    try {
        const data = await window.storageService.getWrongBook(bankName);
        
        const questionList = document.getElementById('wrong-question-list');
        
        const list = data.wrong_questions || data.questions;
        if (data.success && list && list.length > 0) {
            questionList.innerHTML = list.map((q, index) => `
                <div class="question-item ${q.type === 'multi' ? 'multi' : ''}">
                    <div class="question-header">
                        <span class="question-type ${q.type === 'multi' ? 'multi' : ''}">
                            ${q.type === 'multi' ? '???' : '???'}
                        </span>
                        <span class="question-id-badge" title="????">#${q.id}</span>
                        <span class="question-chapter">${q.chapter}</span>
                        <span class="wrong-count-badge" style="margin-left: auto;">?${q.wrong_count || 1}?</span>
                    </div>
                    <div class="question-content">${index + 1}. ${q.question}</div>
                    <div class="question-options">
                        ${Object.entries(q.options || {}).map(([key, value]) => {
                            const isCorrect = q.answer.includes(key) ? 'correct-answer' : '';
                            const isWrong = (q.last_wrong_answer || []).includes(key) && !q.answer.includes(key) ? 'wrong-answer' : '';
                            return `<div class="option-item ${isCorrect} ${isWrong}">${key}. ${value}</div>`;
                        }).join('')}
                    </div>
                    <div class="question-answer">
                        <i class="fas fa-check-circle"></i> ????: ${q.answer.join('')}
                        ${q.last_wrong_answer ? `<span style="margin-left:15px; color:var(--danger-color);"><i class="fas fa-times-circle"></i> ????: ${q.last_wrong_answer.join('')}</span>` : ''}
                    </div>
                    <div class="question-actions">
                        <button class="btn btn-success btn-small" onclick="removeFromWrongbook('${q.id}')">
                            <i class="fas fa-check"></i> ???
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            questionList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-smile"></i>
                    <p>???????</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('??????:', error);
        showToast('??????', 'error');
    }
}

async function removeFromWrongbook(questionId) {
    try {
        const data = await window.storageService.removeWrongQuestion(questionId);
        
        if (data.success) {
            showToast('???????', 'success');
            // ????????????????????
            if (currentPage === 'practice' && practiceQuestions[currentQuestionIndex] && practiceQuestions[currentQuestionIndex].id === questionId) {
                // ?????????
            }
            // ?????????????
            if (currentPage === 'wrongbook') {
                loadWrongQuestions(currentWrongBankName);
            }
        } else {
            showToast(data.error || '????', 'error');
        }
    } catch (error) {
        showToast('????: ' + error.message, 'error');
    }
}

function confirmClearWrongBank(bankName) {
    showConfirmModal(
        '????',
        `?????"${bankName}"???????`,
        async () => {
            try {
                let data;
                if (isElectron) {
                    // Electron ?????????????????????? clearWrongbook (????)
                    // ???????? preload/main ?? clearWrongbookByBank
                    // ???? clearWrongbook ?????????
                    // ????????? clearWrongbookByBank ? Electron API
                    // ???????????????????????
                    // ??????????? main.js ?? clearWrongbook???????
                    // ??????? Electron ???????
                    
                    // ??????? main.js ?????????????
                    // ???????????????????????????????????
                     showToast('Electron????????????????', 'warning');
                     return;
                } else {
                    const response = await fetch(`${API_BASE}/api/wrongbook/bank/${encodeURIComponent(bankName)}`, {
                        method: 'DELETE'
                    });
                    data = await response.json();
                }
                
                if (data.success) {
                    showToast(data.message, 'success');
                    loadWrongBanks();
                } else {
                    showToast(data.error, 'error');
                }
            } catch (error) {
                showToast('????: ' + error.message, 'error');
            }
        }
    );
}

function clearWrongQuestionsByBank() {
    if (currentWrongBankName) {
        confirmClearWrongBank(currentWrongBankName);
    }
}

// ????????
async function addToWrongbook(question, userAnswer) {
    try {
        // ????????????????????????
        let originalUserAnswer = userAnswer;
        if (question.reverseAnswerMap) {
            originalUserAnswer = userAnswer.map(ans => question.reverseAnswerMap[ans] || ans);
        }
        
        await window.storageService.addWrongQuestion({
            questionId: question.id,
            question_id: question.id,
            bank: question.bank,
            user_answer: originalUserAnswer,
            question: question
        });
    } catch (error) {
        console.error('??????:', error);
    }
}

// ==================== ?????? ====================
async function loadProgressList() {
    try {
        const data = await window.storageService.getProgressList();
        
        const container = document.getElementById('progress-list');
        if (!container) return;
        
        if (data.success && data.progress_list.length > 0) {
            container.innerHTML = data.progress_list.map(p => {
                const modeNames = {
                    'random': '????',
                    'exam': '????',
                    'sequence': '????',
                    'wrong': '????'
                };
                return `
                    <div class="progress-item" onclick="loadProgress('${p.id}')">
                        <div>
                            <div class="mode-name">${modeNames[p.mode] || '??'}</div>
                            <div class="progress-info">${p.bank || '??'} | ${p.current_index + 1}/${p.total}?</div>
                        </div>
                        <div class="progress-actions">
                            <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteProgress('${p.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div class="empty-progress">???????</div>';
        }
    } catch (error) {
        console.error('??????:', error);
    }
}

async function saveCurrentProgress() {
    if (practiceQuestions.length === 0) {
        showToast('??????????', 'warning');
        return;
    }
    
    // ????????????? + ????????
    const currentSessionTime = Math.floor((new Date() - practiceStartTime) / 1000);
    const totalElapsedTime = loadedElapsedTime + currentSessionTime;
    
    // ???????????????????
    // shuffleMap: { questionId: { shuffledOptions, shuffledAnswer, reverseAnswerMap } }
    const shuffleMap = {};
    practiceQuestions.forEach(q => {
        if (q.shuffledOptions || q.shuffledAnswer || q.reverseAnswerMap) {
            shuffleMap[q.id] = {
                shuffledOptions: q.shuffledOptions,
                shuffledAnswer: q.shuffledAnswer,
                reverseAnswerMap: q.reverseAnswerMap
            };
        }
    });
    
    const progressData = {
        progress_id: currentProgressId, // ???ID??????????
        mode: currentPracticeMode,
        bank: lastPracticeSettings?.bank || '',
        chapter: lastPracticeSettings?.chapter || '',
        current_index: currentQuestionIndex,
        total: practiceQuestions.length,
        correct: correctCount,
        wrong: wrongCount,
        question_ids: practiceQuestions.map(q => q.id),
        shuffle_map: shuffleMap,  // ???????????? questions?
        question_results: questionResults,
        remaining_time: remainingTime,
        elapsed_time: totalElapsedTime  // ??????
    };
    
    try {
        const data = await window.storageService.saveProgress(progressData);
        
        if (data.success) {
            // ??????ID
            if (data.id) {
                currentProgressId = data.id;
            } else if (data.progress && data.progress.id) {
                // Compatible with backend API
                currentProgressId = data.progress.id;
            }
            showToast('?????', 'success');
            loadProgressList();
        } else {
            showToast('????', 'error');
        }
    } catch (error) {
        showToast('????: ' + error.message, 'error');
    }
}

async function loadProgress(progressId) {
    try {
        const data = await window.storageService.getProgressById(progressId);
        
        if (data.success && data.progress) {
            const progress = data.progress;
            
            // ? API ????
            const questionIds = progress.question_ids || [];
            if (questionIds.length === 0) {
                showToast('????????????', 'error');
                return;
            }
            
            const questionsData = await window.storageService.getQuestions();
            
            if (!questionsData.success || !questionsData.questions) {
                showToast('??????', 'error');
                return;
            }
            
            const questionMap = {};
            questionsData.questions.forEach(q => { questionMap[q.id] = q; });
            practiceQuestions = questionIds.map(id => questionMap[id]).filter(q => q);
            
            if (practiceQuestions.length === 0) {
                showToast('??????????', 'error');
                return;
            }
            
            // ??????????????
            const shuffleMap = progress.shuffle_map || {};
            practiceQuestions = practiceQuestions.map(q => {
                const shuffle = shuffleMap[q.id];
                if (shuffle) {
                    return {
                        ...q,
                        shuffledOptions: shuffle.shuffledOptions,
                        shuffledAnswer: shuffle.shuffledAnswer,
                        reverseAnswerMap: shuffle.reverseAnswerMap
                    };
                }
                // ??????? questions ????????
                if (progress.questions && Array.isArray(progress.questions)) {
                    const savedQ = progress.questions.find(sq => sq.id === q.id);
                    if (savedQ) {
                        return {
                            ...q,
                            shuffledOptions: savedQ.shuffledOptions,
                            shuffledAnswer: savedQ.shuffledAnswer,
                            reverseAnswerMap: savedQ.reverseAnswerMap
                        };
                    }
                }
                return q;
            });
            
            currentQuestionIndex = progress.current_index || 0;
            correctCount = progress.correct || 0;
            wrongCount = progress.wrong || 0;
            questionResults = progress.question_results || practiceQuestions.map(() => ({
                answered: false, userAnswer: [], correctAnswer: [], isCorrect: null
            }));
            currentPracticeMode = progress.mode || 'random';
            isExamMode = progress.mode === 'exam';
            remainingTime = progress.remaining_time || 0;
            practiceStartTime = new Date();
            navCurrentPage = 1; // ???????
            
            // ????ID???????????????????
            currentProgressId = progressId;
            loadedElapsedTime = progress.elapsed_time || 0;
            
            lastPracticeSettings = {
                bank: progress.bank,
                chapter: progress.chapter,
                mode: progress.mode
            };
            
            // ??????
            document.getElementById('practice-settings').style.display = 'none';
            document.getElementById('practice-area').style.display = 'block';
            document.getElementById('practice-result').style.display = 'none';
            document.getElementById('practice-header-info').style.display = 'flex';
            
            // ????????
            const navPanel = document.getElementById('question-nav-panel');
            navPanel.style.display = 'block';
            navPanel.classList.remove('collapsed');
            navPanel.classList.add('expanded');
            
            // ????????????
            document.getElementById('ranking-panel-wrapper').classList.add('collapsed');
            
            const modeBadge = document.getElementById('practice-mode-badge');
            const modeTexts = {
                'random': '????',
                'exam': '????',
                'sequence': '????',
                'wrong': '????'
            };
            modeBadge.textContent = modeTexts[currentPracticeMode] || '????';
            modeBadge.className = `practice-mode-badge ${currentPracticeMode}`;
            
            document.getElementById('score-info').style.display = isExamMode ? 'none' : 'flex';
            
            // ????????????
            if (practiceTimer) {
                clearInterval(practiceTimer);
                practiceTimer = null;
            }
            if (remainingTime > 0) {
                document.getElementById('timer-display').style.display = 'flex';
                updateTimerDisplay();
                practiceTimer = setInterval(updateTimer, 1000);
            } else {
                document.getElementById('timer-display').style.display = 'none';
            }
            
            renderQuestionNav();
            renderQuestion();
            
            showToast('?????', 'success');
            
            // ??????????????
            loadProgressList();
        } else {
            showToast('??????', 'error');
        }
    } catch (error) {
        showToast('??????: ' + error.message, 'error');
    }
}

async function deleteProgress(progressId, silent = false) {
    try {
        const data = await window.storageService.deleteProgress(progressId);
        
        if (data.success) {
            if (!silent) {
                showToast('?????', 'success');
            }
            loadProgressList();
        }
    } catch (error) {
        if (!silent) {
            showToast('????: ' + error.message, 'error');
        }
    }
}

// ==================== ???? ====================
function initAnimations() {
    initPageLoader();
    initParticles();
    initScrollReveal();
    initMouseGlow();
    initButtonRipple();
    initNavScroll();
    featureCarousel.init();
}

function initPageLoader() {
    var loader = document.getElementById('pageLoader');
    if (!loader) return;
    setTimeout(function() {
        loader.classList.add('loaded');
        setTimeout(function() {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 600);
    }, 1200);
}

function initParticles() {
    var container = document.getElementById('particlesBg');
    if (!container) return;

    var particleCount = 25;
    var colors = [
        'rgba(124, 92, 252, 0.5)',
        'rgba(167, 139, 250, 0.4)',
        'rgba(236, 72, 153, 0.35)',
        'rgba(59, 130, 246, 0.4)',
        'rgba(251, 146, 60, 0.35)',
        'rgba(16, 185, 129, 0.3)',
        'rgba(196, 181, 253, 0.3)'
    ];

    for (var i = 0; i < particleCount; i++) {
        var p = document.createElement('div');
        p.className = 'particle';
        var size = Math.random() * 4 + 2;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDuration = (Math.random() * 15 + 10) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(p);
    }
}

function initScrollReveal() {
    var elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var delay = entry.target.getAttribute('data-reveal-delay');
                    if (delay) {
                        setTimeout(function() { entry.target.classList.add('revealed'); }, parseInt(delay));
                    } else {
                        entry.target.classList.add('revealed');
                    }
                } else {
                    entry.target.classList.remove('revealed');
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

        elements.forEach(function(el) {
            observer.observe(el);
        });

        window._scrollRevealObserver = observer;
    } else {
        elements.forEach(function(el) {
            el.classList.add('revealed');
        });
    }
}

function resetScrollReveal() {
    if (window._scrollRevealObserver) {
        window._scrollRevealObserver.disconnect();
        window._scrollRevealObserver = null;
    }
    var elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
    elements.forEach(function(el) { el.classList.remove('revealed'); });
    setTimeout(function() { initScrollReveal(); }, 100);
}

function initMouseGlow() {
    var glow = document.getElementById('mouseGlow');
    if (!glow) return;

    var rafId = null;
    var targetX = 0, targetY = 0;

    document.addEventListener('mousemove', function(e) {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!rafId) {
            rafId = requestAnimationFrame(function() {
                glow.style.left = targetX + 'px';
                glow.style.top = targetY + 'px';
                rafId = null;
            });
        }
    });
}

function initButtonRipple() {
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.btn');
        if (!btn) return;

        var ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);

        setTimeout(function() {
            if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 600);
    });
}

function initNavScroll() {
    var nav = document.getElementById('topNav');
    if (!nav) return;
    window.addEventListener('scroll', function() {
        if (window.scrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

var fcState = {
    current: 0,
    total: 0,
    isDragging: false,
    startX: 0,
    currentX: 0,
    dragThreshold: 30,
    visibleCount: 5,
    cardWidth: 420,
    isAnimating: false
};

function initFeaturesCarousel() {
    var wrap = document.getElementById('featuresCardsWrap');
    var track = document.getElementById('featuresCardsTrack');
    if (!wrap || !track) return;
    var cards = track.querySelectorAll('.feature-card');
    fcState.total = cards.length;
    fcState.current = 0;
    if (fcState.total === 0) return;

    fcState.cardWidth = window.innerWidth <= 768 ? 260 : 420;

    wrap.addEventListener('mousedown', function(e) {
        if (fcState.isAnimating) return;
        fcState.isDragging = true;
        fcState.startX = e.clientX;
        fcState.currentX = e.clientX;
        wrap.style.cursor = 'grabbing';
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (!fcState.isDragging) return;
        fcState.currentX = e.clientX;
    });
    document.addEventListener('mouseup', function() {
        if (!fcState.isDragging) return;
        fcState.isDragging = false;
        wrap.style.cursor = 'grab';
        var dx = fcState.currentX - fcState.startX;
        if (Math.abs(dx) > fcState.dragThreshold) {
            scrollFeatures(dx > 0 ? -1 : 1);
        }
    });

    wrap.addEventListener('touchstart', function(e) {
        if (fcState.isAnimating) return;
        fcState.isDragging = true;
        fcState.startX = e.touches[0].clientX;
        fcState.currentX = e.touches[0].clientX;
        e.preventDefault();
    }, { passive: false });
    wrap.addEventListener('touchmove', function(e) {
        if (!fcState.isDragging) return;
        fcState.currentX = e.touches[0].clientX;
    }, { passive: false });
    wrap.addEventListener('touchend', function() {
        if (!fcState.isDragging) return;
        fcState.isDragging = false;
        var dx = fcState.currentX - fcState.startX;
        if (Math.abs(dx) > fcState.dragThreshold) {
            scrollFeatures(dx > 0 ? -1 : 1);
        }
    });

    window.addEventListener('resize', function() {
        fcState.cardWidth = window.innerWidth <= 768 ? 260 : 420;
        updateCarouselDisplay();
    });

    updateCarouselDisplay();
}

function scrollFeatures(direction) {
    if (fcState.total === 0 || fcState.isAnimating) return;
    fcState.current = (fcState.current + direction + fcState.total) % fcState.total;
    fcState.isAnimating = true;
    updateCarouselDisplay();
    setTimeout(function() { fcState.isAnimating = false; }, 400);
}

function getCardOffsetFromCenter(idx, current) {
    var diff = idx - current;
    var half = Math.floor(fcState.total / 2);
    if (diff > half) diff -= fcState.total;
    if (diff < -half) diff += fcState.total;
    return diff;
}

function updateCarouselDisplay() {
    var wrap = document.getElementById('featuresCardsWrap');
    var track = document.getElementById('featuresCardsTrack');
    if (!wrap || !track || fcState.total === 0) return;

    var wrapWidth = wrap.offsetWidth;
    var wrapHeight = wrap.offsetHeight;
    var cardW = fcState.cardWidth;
    var cardH = 260;
    var centerX = wrapWidth / 2 - cardW / 2;
    var centerY = wrapHeight / 2 - cardH / 2;
    var visibleCount = fcState.total >= 4 ? Math.floor(fcState.total / 2) : fcState.total;

    var cards = track.querySelectorAll('.feature-card');
    cards.forEach(function(card, i) {
        var offset = getCardOffsetFromCenter(i, fcState.current);
        var absOffset = Math.abs(offset);
        var isVisible = absOffset <= Math.ceil(visibleCount / 2);
        var scale = isVisible ? (1 - absOffset * 0.1) : 0.85;
        var opacity = isVisible ? (1 - absOffset * 0.22) : 0;
        var tx = centerX + offset * (cardW * 0.55);
        var ty = centerY + absOffset * 10;
        var zIndex = fcState.total - absOffset;

        card.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease';
        card.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + scale + ')';
        card.style.opacity = opacity;
        card.style.zIndex = zIndex;
        card.style.pointerEvents = isVisible ? 'auto' : 'none';

        if (offset === 0) card.classList.add('is-active');
        else card.classList.remove('is-active');
    });
}

function toggleMobileMenu() {
    var btn = document.getElementById('gnavMenuBtn');
    var nav = document.querySelector('.top-nav .nav-links');
    if (!btn || !nav) return;
    btn.classList.toggle('is-active');
    nav.classList.toggle('is-open');
}
