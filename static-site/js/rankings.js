/**
 * 排行榜管理模块
 */

const Rankings = {
    /**
     * 获取所有排行榜数据
     */
    getAll() {
        return Storage.getRankings();
    },

    /**
     * 添加成绩记录
     */
    add(record) {
        const data = this.getAll();
        
        data.rankings.push({
            id: Date.now().toString(),
            playerName: record.playerName || Storage.getPlayerName(),
            bankName: record.bankName,
            score: record.score,
            correctCount: record.correctCount,
            totalCount: record.totalCount,
            accuracy: record.accuracy,
            duration: record.duration,
            mode: record.mode || 'practice',
            createTime: new Date().toISOString()
        });
        
        // 按分数排序，保留最近100条
        data.rankings.sort((a, b) => b.score - a.score);
        data.rankings = data.rankings.slice(0, 100);
        
        Storage.setRankings(data);
        return true;
    },

    /**
     * 获取指定题库的排行榜
     */
    getByBank(bankName, limit = 10) {
        const data = this.getAll();
        return data.rankings
            .filter(r => r.bankName === bankName)
            .slice(0, limit);
    },

    /**
     * 获取总排行榜
     */
    getTop(limit = 10) {
        const data = this.getAll();
        return data.rankings.slice(0, limit);
    },

    /**
     * 清空排行榜
     */
    clear() {
        Storage.setRankings({ rankings: [] });
        return true;
    },

    /**
     * 获取玩家最佳成绩
     */
    getPlayerBest(playerName) {
        const data = this.getAll();
        const playerRecords = data.rankings.filter(r => r.playerName === playerName);
        
        if (playerRecords.length === 0) return null;
        
        return playerRecords.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }
};

// 导出
window.Rankings = Rankings;
