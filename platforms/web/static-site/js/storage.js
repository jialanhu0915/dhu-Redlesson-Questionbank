/**
 * 本地存储管理模块
 * 处理所有localStorage操作
 */

const Storage = {
    // 存储键名
    KEYS: {
        QUESTIONS: 'quiz_questions',
        WRONGBOOK: 'quiz_wrongbook',
        RANKINGS: 'quiz_rankings',
        PROGRESS: 'quiz_progress',
        PLAYER_NAME: 'quiz_player_name',
        SETTINGS: 'quiz_settings'
    },

    /**
     * 获取数据
     */
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage.get error:', e);
            return defaultValue;
        }
    },

    /**
     * 保存数据
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage.set error:', e);
            return false;
        }
    },

    /**
     * 删除数据
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage.remove error:', e);
            return false;
        }
    },

    /**
     * 获取题库数据
     */
    getQuestions() {
        return this.get(this.KEYS.QUESTIONS, { banks: {} });
    },

    /**
     * 保存题库数据
     */
    setQuestions(data) {
        return this.set(this.KEYS.QUESTIONS, data);
    },

    /**
     * 获取错题本
     */
    getWrongbook() {
        return this.get(this.KEYS.WRONGBOOK, { banks: {} });
    },

    /**
     * 保存错题本
     */
    setWrongbook(data) {
        return this.set(this.KEYS.WRONGBOOK, data);
    },

    /**
     * 获取排行榜
     */
    getRankings() {
        return this.get(this.KEYS.RANKINGS, { rankings: [] });
    },

    /**
     * 保存排行榜
     */
    setRankings(data) {
        return this.set(this.KEYS.RANKINGS, data);
    },

    /**
     * 获取进度
     */
    getProgress() {
        return this.get(this.KEYS.PROGRESS, { progress: [] });
    },

    /**
     * 保存进度
     */
    setProgress(data) {
        return this.set(this.KEYS.PROGRESS, data);
    },

    /**
     * 获取玩家名称
     */
    getPlayerName() {
        return this.get(this.KEYS.PLAYER_NAME, '匿名用户');
    },

    /**
     * 保存玩家名称
     */
    setPlayerName(name) {
        return this.set(this.KEYS.PLAYER_NAME, name);
    },

    /**
     * 获取设置
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS, {
            shuffleOptions: false,
            showAnalysis: true,
            autoNext: false
        });
    },

    /**
     * 保存设置
     */
    setSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    }
};

// 导出
window.Storage = Storage;
