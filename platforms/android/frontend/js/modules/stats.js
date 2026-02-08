/**
 * 统计数据模块
 */

const statsUseMobileStore = window.useMobileStore ?? (window.useMobileStore = isMobile && !isElectron);

async function loadStats() {
    try {
        const data = isElectron ?
            await window.electronAPI.getStats() :
            statsUseMobileStore ?
                await storageService.getStatsByBank() :
                await (await fetch(`${API_BASE}/api/stats`)).json();
        
        if (data.success) {
            const stats = data.stats || {};

            if (statsUseMobileStore) {
                const allQuestions = await storageService.db.questions.toArray();
                const totalBanks = Object.keys(stats).length;
                const singleCount = allQuestions.filter(q => q.type === 'single').length;
                const multiCount = allQuestions.filter(q => q.type === 'multi').length;
                document.getElementById('total-banks').textContent = totalBanks;
                document.getElementById('total-questions').textContent = allQuestions.length;
                document.getElementById('single-count').textContent = singleCount;
                document.getElementById('multi-count').textContent = multiCount;
            } else {
                document.getElementById('total-banks').textContent = stats.total_banks;
                document.getElementById('total-questions').textContent = stats.total_questions;
                document.getElementById('single-count').textContent = stats.single_choice_count;
                document.getElementById('multi-count').textContent = stats.multi_choice_count;
            }
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}
