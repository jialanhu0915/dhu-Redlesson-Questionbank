/**
 * 移动端适配与远程访问功能 - 简化版
 */

// 全局变量
var isLocalClient = true;
var mobileInitialized = false;
var currentTheme = 'auto'; // 'light', 'dark', 'auto'

// 页面加载完成后初始化
window.addEventListener('load', function() {
    // 延迟执行，确保 app.js 已经加载
    setTimeout(function() {
        initMobile();
    }, 100);

    // 初始化主题
    initTheme();
});

// 新增：如果页面已经加载完成，立即执行
if (document.readyState === 'complete') {
    setTimeout(function() {
        console.log('页面已加载完成，立即初始化移动端');
        if (typeof initMobile === 'function') {
            initMobile();
        }
    }, 100);
}

// 禁止双指缩放
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// 禁止双击缩放
var lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    var now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

function initMobile() {
    // 防止重复初始化
    if (mobileInitialized) {
        console.log('移动端已初始化，跳过重复调用');
        return;
    }

    mobileInitialized = true;

    console.log('=== 移动端初始化开始 ===');
    console.log('屏幕宽度:', window.innerWidth);
    console.log('屏幕高度:', window.innerHeight);
    console.log('Capacitor:', window.Capacitor !== undefined);
    console.log('Electron:', window.electronAPI !== undefined);

    //1. 检测客户端类型
    checkClientType();

    //2. 强制在 Capacitor 环境或小屏幕下初始化移动端功能
    if (window.Capacitor !== undefined || window.innerWidth < 768) {
        console.log('检测到移动端环境，初始化移动端功能...');

        initBottomTabBar();

        console.log('✓ 移动端功能初始化完成');
    } else {
        console.log('桌面端环境，跳过移动端功能初始化');
    }
}

// 检测是否为本地客户端
function checkClientType() {
    // Electron 环境始终是本地客户端
    if (window.electronAPI !== undefined) {
        isLocalClient = true;
        return;
    }

    // Capacitor/离线模式是本地客户端
    if (window.Capacitor !== undefined || (window.storageService && window.storageService.isMobile)) {
        isLocalClient = true;
        showRemoteBadge();
        return;
    }

    // Web 环境：尝试连接服务器
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/client/info', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    isLocalClient = data.is_local;
                    if (!isLocalClient) {
                        document.body.className += ' remote-mode';
                        showRemoteBadge();
                        setupLocalStorage();
                    }
                }
            } catch (e) {
                console.error('解析客户端信息失败', e);
            }
        }
    };
    xhr.send();
}

// 显示远程模式标识
function showRemoteBadge() {
    var badge = document.createElement('div');
    badge.className = 'storage-mode-badge';
    badge.innerHTML = '<i class="fas fa-mobile-alt"></i> 本地存储模式';
    document.body.appendChild(badge);
}

// ==================== 底部标签栏导航 ====================
function initBottomTabBar() {
    console.log('初始化底部标签栏...');

    var tabItems = document.querySelectorAll('.bottom-tab-bar .tab-item');
    if (tabItems.length === 0) {
        console.warn('底部标签栏元素未找到');
        return;
    }

    // 绑定点击事件
    tabItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var page = this.getAttribute('data-page');
            console.log('底部标签栏点击:', page);

            // 切换页面
            if (typeof switchPage === 'function') {
                switchPage(page);
            } else {
                console.warn('switchPage 函数未定义');
            }
        });
    });

    console.log('✓ 底部标签栏初始化完成');
}

// 更新底部标签栏激活状态
function updateBottomTabBar(page) {
    var tabItems = document.querySelectorAll('.bottom-tab-bar .tab-item');
    tabItems.forEach(function(item) {
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ==================== 主题切换功能 ====================
function initTheme() {
    // 从 localStorage 读取用户偏好
    var savedTheme = localStorage.getItem('theme') || 'auto';
    currentTheme = savedTheme;

    applyTheme(savedTheme);
    updateThemeIcon();
}

function applyTheme(theme) {
    var root = document.documentElement;

    if (theme === 'auto') {
        // 自动模式：移除 data-theme 属性，使用系统偏好
        root.removeAttribute('data-theme');
    } else {
        // 手动模式：设置 data-theme 属性
        root.setAttribute('data-theme', theme);
    }
}

function toggleTheme() {
    // 循环切换：auto → light → dark → auto
    if (currentTheme === 'auto') {
        currentTheme = 'light';
    } else if (currentTheme === 'light') {
        currentTheme = 'dark';
    } else {
        currentTheme = 'auto';
    }

    // 保存到 localStorage
    localStorage.setItem('theme', currentTheme);

    // 应用主题
    applyTheme(currentTheme);
    updateThemeIcon();

    // 显示提示
    var themeName = currentTheme === 'auto' ? '自动' : (currentTheme === 'light' ? '浅色' : '深色');
    showToast('已切换到' + themeName + '模式', 'success');
}

function updateThemeIcon() {
    // 检测当前实际应用的主题
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                 (document.documentElement.getAttribute('data-theme') !== 'light' &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches);

    // 更新首页主题图标
    var dashboardIcon = document.getElementById('theme-icon-dashboard');
    if (dashboardIcon) {
        dashboardIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ==================== 触觉反馈 ====================

// ==================== 本地存储功能 ====================
function setupLocalStorage() {
    // 初始化存储
    if (!localStorage.getItem('quiz_wrongbook')) {
        localStorage.setItem('quiz_wrongbook', '[]');
    }
    if (!localStorage.getItem('quiz_progress')) {
        localStorage.setItem('quiz_progress', '[]');
    }

    // 覆盖fetch
    var originalFetch = window.fetch;
    window.fetch = function(url, options) {
        var urlStr = url.toString();
        options = options || {};

        // 错题本API
        if (urlStr.indexOf('/api/wrongbook') !== -1 && !isLocalClient) {
            return handleWrongbook(urlStr, options);
        }

        // 进度API
        if (urlStr.indexOf('/api/progress') !== -1 && !isLocalClient) {
            return handleProgress(urlStr, options);
        }

        // 错题练习
        if (urlStr.indexOf('/api/practice/wrong') !== -1 && !isLocalClient) {
            return handleWrongPractice(urlStr, options);
        }

        return originalFetch(url, options);
    };
}

function mockResponse(data) {
    return Promise.resolve({
        ok: true,
        json: function() { return Promise.resolve(data); }
    });
}

function handleWrongbook(url, options) {
    var method = options.method || 'GET';
    var wrongbook = JSON.parse(localStorage.getItem('quiz_wrongbook') || '[]');
    
    // 获取错题本统计 (stats接口) - 返回格式与后端一致
    if (method === 'GET' && url.indexOf('/stats') !== -1) {
        var stats = {};
        wrongbook.forEach(function(q) {
            var name = q.bank || '未分类';
            if (!stats[name]) {
                stats[name] = { total: 0, single: 0, multi: 0 };
            }
            stats[name].total++;
            if (q.type === 'multi') {
                stats[name].multi++;
            } else {
                stats[name].single++;
            }
        });
        return mockResponse({ success: true, stats: stats });
    }
    
    // 获取错题本题库列表 (banks接口 - 兼容)
    if (method === 'GET' && url.indexOf('/banks') !== -1) {
        var banks = {};
        wrongbook.forEach(function(q) {
            var name = q.bank || '未分类';
            if (!banks[name]) banks[name] = { name: name, count: 0 };
            banks[name].count++;
        });
        return mockResponse({ success: true, banks: Object.values(banks) });
    }
    
    if (method === 'GET') {
        // 检查是否有bank参数筛选
        var bankMatch = url.match(/[?&]bank=([^&]*)/);
        var bankName = bankMatch ? decodeURIComponent(bankMatch[1]) : null;
        
        var filteredQuestions = wrongbook;
        if (bankName) {
            filteredQuestions = wrongbook.filter(function(q) {
                return q.bank === bankName;
            });
        }
        return mockResponse({ 
            success: true, 
            questions: filteredQuestions,
            wrong_questions: filteredQuestions,  // 兼容两种字段名
            total: filteredQuestions.length 
        });
    }
    
    if (method === 'POST') {
        var body = JSON.parse(options.body);
        var exists = wrongbook.some(function(q) { return q.id === body.question_id; });
        if (!exists && body.question) {
            // 保存完整题目信息
            var questionToSave = JSON.parse(JSON.stringify(body.question));
            questionToSave.wrong_count = 1;
            questionToSave.last_wrong_time = new Date().toLocaleString('zh-CN');
            questionToSave.user_answer = body.user_answer;  // 保存用户的错误答案
            wrongbook.push(questionToSave);
            localStorage.setItem('quiz_wrongbook', JSON.stringify(wrongbook));
        } else if (exists) {
            // 如果已存在，增加错误次数
            for (var i = 0; i < wrongbook.length; i++) {
                if (wrongbook[i].id === body.question_id) {
                    wrongbook[i].wrong_count = (wrongbook[i].wrong_count || 1) + 1;
                    wrongbook[i].last_wrong_time = new Date().toLocaleString('zh-CN');
                    break;
                }
            }
            localStorage.setItem('quiz_wrongbook', JSON.stringify(wrongbook));
        }
        return mockResponse({ success: true, message: '已加入错题本' });
    }
    
    if (method === 'DELETE') {
        var urlParts = url.split('/');
        var lastPart = urlParts[urlParts.length - 1].split('?')[0];
        
        // 检查是否是按题库删除
        if (url.indexOf('/bank/') !== -1) {
            var bankIdx = urlParts.indexOf('bank');
            if (bankIdx !== -1 && urlParts[bankIdx + 1]) {
                var bankToDelete = decodeURIComponent(urlParts[bankIdx + 1].split('?')[0]);
                wrongbook = wrongbook.filter(function(q) { return q.bank !== bankToDelete; });
            }
        } else if (lastPart && lastPart !== 'wrongbook') {
            // 按ID删除单个错题
            wrongbook = wrongbook.filter(function(q) { return q.id !== lastPart; });
        } else {
            // 清空全部
            wrongbook = [];
        }
        localStorage.setItem('quiz_wrongbook', JSON.stringify(wrongbook));
        return mockResponse({ success: true, message: '已删除' });
    }
    
    return mockResponse({ success: false });
}

function handleProgress(url, options) {
    var method = options.method || 'GET';
    var progress = JSON.parse(localStorage.getItem('quiz_progress') || '[]');
    
    if (method === 'GET') {
        // 检查是否请求单个进度
        var urlParts = url.split('/');
        var lastPart = urlParts[urlParts.length - 1].split('?')[0];
        if (lastPart && lastPart !== 'progress' && lastPart.length > 0) {
            // 请求单个进度
            var item = null;
            for (var i = 0; i < progress.length; i++) {
                if (progress[i].id === lastPart) {
                    item = progress[i];
                    break;
                }
            }
            return mockResponse({ success: true, progress: item });
        }
        // 返回进度列表，注意字段名是 progress_list
        return mockResponse({ success: true, progress_list: progress });
    }
    
    if (method === 'POST') {
        var body = JSON.parse(options.body);
        var progressId = body.progress_id || body.id || Date.now().toString();
        var newProgress = {
            id: progressId,
            bank: body.bank || body.bank_name || '全部',
            chapter: body.chapter || '',
            mode: body.mode || 'random',
            current_index: body.current_index || 0,
            total: body.total || 0,
            correct: body.correct || 0,
            wrong: body.wrong || 0,
            elapsed_time: body.elapsed_time || 0,
            remaining_time: body.remaining_time || 0,
            question_ids: body.question_ids || [],
            shuffle_map: body.shuffle_map || {},  // 乱序映射
            question_results: body.question_results || [],
            save_time: new Date().toLocaleString('zh-CN')
        };
        
        var idx = -1;
        for (var i = 0; i < progress.length; i++) {
            if (progress[i].id === progressId) { idx = i; break; }
        }
        if (idx >= 0) progress[idx] = newProgress;
        else progress.unshift(newProgress);
        if (progress.length > 20) progress.length = 20;
        
        localStorage.setItem('quiz_progress', JSON.stringify(progress));
        return mockResponse({ success: true, progress: newProgress, message: '进度已保存' });
    }
    
    if (method === 'DELETE') {
        var progressId = url.split('/').pop();
        progress = progress.filter(function(p) { return p.id !== progressId; });
        localStorage.setItem('quiz_progress', JSON.stringify(progress));
        return mockResponse({ success: true, message: '已删除' });
    }
    
    return mockResponse({ success: false });
}

function handleWrongPractice(url, options) {
    var wrongbook = JSON.parse(localStorage.getItem('quiz_wrongbook') || '[]');
    return mockResponse({ success: true, questions: wrongbook, total: wrongbook.length });
}

// ==================== 导出到全局作用域 ====================
// 确保 HTML 中的 onclick 可以调用这些函数

// 主题切换函数
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.updateThemeIcon = updateThemeIcon;

// 底部标签栏函数
window.updateBottomTabBar = updateBottomTabBar;

// 移动端初始化函数
window.initMobile = initMobile;
window.initBottomTabBar = initBottomTabBar;
