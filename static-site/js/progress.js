/**
 * 进度管理模块
 */

const Progress = {
    /**
     * 获取所有进度
     */
    getAll() {
        return Storage.getProgress();
    },

    /**
     * 保存进度
     */
    save(progressData) {
        const data = this.getAll();
        
        const newProgress = {
            id: Date.now().toString(),
            bankName: progressData.bankName,
            mode: progressData.mode,
            currentIndex: progressData.currentIndex,
            totalCount: progressData.totalCount,
            correctCount: progressData.correctCount,
            wrongCount: progressData.wrongCount,
            questionResults: progressData.questionResults,
            questions: progressData.questions,
            createTime: new Date().toISOString()
        };
        
        // 检查是否已有该题库的进度，有则更新
        const existIndex = data.progress.findIndex(p => 
            p.bankName === progressData.bankName && p.mode === progressData.mode
        );
        
        if (existIndex >= 0) {
            data.progress[existIndex] = newProgress;
        } else {
            data.progress.push(newProgress);
        }
        
        // 只保留最近20条进度
        data.progress = data.progress.slice(-20);
        
        Storage.setProgress(data);
        return newProgress.id;
    },

    /**
     * 加载进度
     */
    load(progressId) {
        const data = this.getAll();
        return data.progress.find(p => p.id === progressId);
    },

    /**
     * 删除进度
     */
    remove(progressId) {
        const data = this.getAll();
        data.progress = data.progress.filter(p => p.id !== progressId);
        Storage.setProgress(data);
        return true;
    },

    /**
     * 获取最近进度列表
     */
    getRecent(limit = 10) {
        const data = this.getAll();
        return data.progress.slice(-limit).reverse();
    },

    /**
     * 清空所有进度
     */
    clearAll() {
        Storage.setProgress({ progress: [] });
        return true;
    }
};

// 导出
window.Progress = Progress;
