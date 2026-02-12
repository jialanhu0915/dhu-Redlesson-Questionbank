// ==================== 练习设置持久化 ====================

const PRACTICE_SETTINGS_KEY = 'redlesson_practice_settings';

// 保存练习设置到localStorage
function savePracticeSettingsToLocal() {
    const settings = {
        bank: document.getElementById('practice-bank').value,
        chapter: document.getElementById('practice-chapter').value,
        mode: document.getElementById('practice-mode').value,
        singleCount: document.getElementById('practice-single-count').value,
        multiCount: document.getElementById('practice-multi-count').value,
        enableTimer: document.getElementById('enable-timer').checked,
        practiceTime: document.getElementById('practice-time').value,
        shuffleOptions: document.getElementById('shuffle-options').checked,
        shuffleQuestions: document.getElementById('shuffle-questions')?.checked || false
    };
    localStorage.setItem(PRACTICE_SETTINGS_KEY, JSON.stringify(settings));
}

// 从localStorage恢复练习设置
function loadPracticeSettingsFromLocal() {
    try {
        const saved = localStorage.getItem(PRACTICE_SETTINGS_KEY);
        if (saved) {
            const settings = JSON.parse(saved);
            
            if (document.getElementById('practice-bank')) {
                document.getElementById('practice-bank').value = settings.bank || '';
            }
            if (document.getElementById('practice-chapter')) {
                document.getElementById('practice-chapter').value = settings.chapter || '';
            }
            if (document.getElementById('practice-mode')) {
                document.getElementById('practice-mode').value = settings.mode || 'random';
                // 触发模式切换以更新UI
                if (typeof onPracticeModeChange === 'function') {
                    onPracticeModeChange();
                }
            }
            if (document.getElementById('practice-single-count')) {
                document.getElementById('practice-single-count').value = settings.singleCount || 30;
            }
            if (document.getElementById('practice-multi-count')) {
                document.getElementById('practice-multi-count').value = settings.multiCount || 20;
            }
            if (document.getElementById('enable-timer')) {
                document.getElementById('enable-timer').checked = settings.enableTimer !== false;
            }
            if (document.getElementById('practice-time')) {
                document.getElementById('practice-time').value = settings.practiceTime || 30;
            }
            if (document.getElementById('shuffle-options')) {
                document.getElementById('shuffle-options').checked = settings.shuffleOptions !== false;
            }
            if (document.getElementById('shuffle-questions')) {
                document.getElementById('shuffle-questions').checked = settings.shuffleQuestions || false;
            }
            
            console.log('已恢复练习设置');
        }
    } catch (error) {
        console.error('恢复练习设置失败:', error);
    }
}
