/**
 * 错题本管理模块
 */

const Wrongbook = {
    /**
     * 获取所有错题
     */
    getAll() {
        return Storage.getWrongbook();
    },

    /**
     * 获取指定题库的错题
     */
    getByBank(bankName) {
        const data = this.getAll();
        return data.banks[bankName] || [];
    },

    /**
     * 添加错题
     */
    add(question, userAnswer) {
        const data = this.getAll();
        const bankName = question.bank || '未分类';
        
        if (!data.banks[bankName]) {
            data.banks[bankName] = [];
        }
        
        // 检查是否已存在
        const exists = data.banks[bankName].some(q => 
            q.question === question.question || q.id === question.id
        );
        
        if (!exists) {
            data.banks[bankName].push({
                id: question.id,
                question: question.question,
                options: question.options,
                answer: question.answer,
                type: question.type,
                analysis: question.analysis || '',
                chapter: question.chapter || '',
                userAnswer: userAnswer,
                addTime: new Date().toISOString(),
                wrongCount: 1
            });
        } else {
            // 更新错误次数
            const item = data.banks[bankName].find(q => 
                q.question === question.question || q.id === question.id
            );
            if (item) {
                item.wrongCount = (item.wrongCount || 1) + 1;
                item.userAnswer = userAnswer;
                item.addTime = new Date().toISOString();
            }
        }
        
        Storage.setWrongbook(data);
        return true;
    },

    /**
     * 移除错题
     */
    remove(bankName, questionId) {
        const data = this.getAll();
        
        if (data.banks[bankName]) {
            data.banks[bankName] = data.banks[bankName].filter(q => 
                q.id !== questionId && q.question !== questionId
            );
            
            // 如果该题库没有错题了，删除该题库
            if (data.banks[bankName].length === 0) {
                delete data.banks[bankName];
            }
        }
        
        Storage.setWrongbook(data);
        return true;
    },

    /**
     * 清空指定题库的错题
     */
    clearBank(bankName) {
        const data = this.getAll();
        delete data.banks[bankName];
        Storage.setWrongbook(data);
        return true;
    },

    /**
     * 清空所有错题
     */
    clearAll() {
        Storage.setWrongbook({ banks: {} });
        return true;
    },

    /**
     * 获取统计信息
     */
    getStats() {
        const data = this.getAll();
        const stats = {};
        
        for (const [bankName, questions] of Object.entries(data.banks)) {
            const singleCount = questions.filter(q => q.type === 'single').length;
            const multiCount = questions.filter(q => q.type === 'multi').length;
            
            stats[bankName] = {
                total: questions.length,
                single: singleCount,
                multi: multiCount
            };
        }
        
        return stats;
    },

    /**
     * 获取总错题数
     */
    getTotalCount() {
        const data = this.getAll();
        let total = 0;
        for (const questions of Object.values(data.banks)) {
            total += questions.length;
        }
        return total;
    }
};

// 导出
window.Wrongbook = Wrongbook;
