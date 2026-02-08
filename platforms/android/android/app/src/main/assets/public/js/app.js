/**
 * 题库刷题系统前端逻辑
 * Android 移动端版本 - 精简版
 * 所有业务逻辑函数已移至 modules/ 目录
 */

// ==================== 独有函数 ====================

/**
 * 切换章节折叠状态
 * 用于首页的章节统计折叠
 */
function toggleSectionCollapse(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('collapsed');
        // 更新图标方向
        const icon = section.querySelector('.toggle-icon');
        if (icon) {
            if (section.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            } else {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        }
        // 切换内容显示
        const content = section.querySelector('.bank-chapters-container');
        if (content) {
            content.style.display = section.classList.contains('collapsed') ? 'none' : 'block';
        }
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== 主应用初始化 ===');

    // 调用 modules/ 中的初始化函数
    if (typeof initNavigation === 'function') {
        initNavigation();
    }

    if (typeof initUpload === 'function') {
        initUpload();
    }

    // 设置初始页面属性
    document.body.setAttribute('data-page', 'dashboard');

    // 延迟加载首页数据，确保所有模块已加载完成
    setTimeout(() => {
        if (typeof switchPage === 'function') {
            console.log('触发首页数据加载');
            switchPage('dashboard');  // 自动加载首页统计数据
        } else {
            console.warn('switchPage 函数未定义，跳过首页数据加载');
        }
    }, 100);

    // 暴露函数到全局作用域（用于 HTML onclick 调用）
    // 这些函数定义在各个 modules/ 中
    if (typeof changeNavPage !== 'undefined') {
        window.changeNavPage = changeNavPage;
    }
    if (typeof togglePanel !== 'undefined') {
        window.togglePanel = togglePanel;
    }
    window.toggleSectionCollapse = toggleSectionCollapse;  // app.js 独有函数

    console.log('✓ 主应用初始化完成');
});
