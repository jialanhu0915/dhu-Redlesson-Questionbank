# 炸红题库刷题系统 - 静态版本

这是炸红题库刷题系统的静态网页版本，可以部署到GitHub Pages等静态托管服务上。

## 功能特点

- ✅ 完整的刷题功能（随机练习、顺序练习、模拟考试）
- ✅ 错题本（自动收集错题，支持专项练习）
- ✅ 排行榜（本地存储，记录练习成绩）
- ✅ 进度保存（可保存和恢复练习进度）
- ✅ 移动端适配
- ❌ 题库导入（静态版本不支持）
- ❌ 多用户共享（数据存储在本地浏览器）

## 部署到 GitHub Pages

### 方法一：通过GitHub网页操作

1. **创建GitHub仓库**
   - 登录GitHub，点击右上角 `+` → `New repository`
   - 仓库名称建议：`quiz-app` 或你喜欢的名字
   - 选择 `Public`（公开仓库）
   - 点击 `Create repository`

2. **上传文件**
   - 在仓库页面点击 `uploading an existing file`
   - 将 `static-site` 文件夹内的所有文件拖拽上传：
     - `index.html`
     - `css/` 文件夹
     - `js/` 文件夹
     - `data/` 文件夹
   - 填写提交信息，点击 `Commit changes`

3. **启用GitHub Pages**
   - 进入仓库 `Settings` → `Pages`
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main`，文件夹选择 `/ (root)`
   - 点击 `Save`

4. **访问网站**
   - 等待1-2分钟部署完成
   - 访问地址：`https://你的用户名.github.io/仓库名/`

### 方法二：通过Git命令行

```bash
# 1. 初始化Git仓库
cd static-site
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "Initial commit"

# 4. 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/仓库名.git

# 5. 推送
git branch -M main
git push -u origin main

# 6. 然后在GitHub网页上启用Pages（同方法一的步骤3）
```

## 更新题库数据

如果需要更新题库，请在原项目中运行：

```bash
python static-site/export_data.py
```

然后重新上传 `data/questions.json` 文件到GitHub。

## 本地测试

可以使用Python简单服务器测试：

```bash
cd static-site
python -m http.server 8000
```

然后访问 `http://localhost:8000`

## 文件结构

```
static-site/
├── index.html          # 主页面
├── css/
│   ├── style.css       # 主样式
│   └── mobile.css      # 移动端样式
├── js/
│   ├── storage.js      # 本地存储模块
│   ├── questions.js    # 题目数据模块
│   ├── wrongbook.js    # 错题本模块
│   ├── rankings.js     # 排行榜模块
│   ├── progress.js     # 进度模块
│   ├── static-adapter.js # 静态适配器
│   ├── app.js          # 主应用
│   └── mobile.js       # 移动端适配
└── data/
    └── questions.json  # 题库数据
```

## 注意事项

1. 数据存储在浏览器的localStorage中，清除浏览器数据会丢失错题本、排行榜等数据
2. 不同设备/浏览器的数据不会同步
3. 建议使用现代浏览器（Chrome、Firefox、Edge、Safari）
