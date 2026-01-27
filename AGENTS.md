# AGENTS.md

## 项目概述

**项目名称**: DHU 红课题库刷题系统

**技术栈**:
- 后端: Flask (Python) + JSON 存储
- 前端: HTML5 + CSS3 + Vanilla JavaScript
- 文档解析: python-docx, pywin32 (Windows .doc)
- 移动端: Capacitor (Android)
- 桌面端: Electron (计划中)

**适用场景**: 政治理论课程题库练习（习概/毛概/思修/近代史）

---

## 开发命令

### 环境设置

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境（Windows）
.venv\Scripts\activate

# 激活虚拟环境（Linux/Mac）
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 运行服务

```bash
# 进入 web 目录
cd platforms/web

# 启动主服务器（默认端口 50000）
python main.py

# 服务器启动后会自动在浏览器打开
# 本机访问: http://127.0.0.1:50000
```

### 导出静态数据（用于 GitHub Pages 部署）

```bash
# 进入 web 目录
cd platforms/web

# 导出题库数据到 static-site 目录
python static-site/export_data.py
```

### Electron 桌面应用（计划中）

> 详细计划参考 [docs/ELECTRON_PLAN.md](docs/ELECTRON_PLAN.md)

```bash
cd platforms/electron
npm install
npm run dev          # 开发模式
npm run build:win    # 打包 Windows
npm run build:mac    # 打包 macOS
```

### Android 应用开发

```bash
cd platforms/android

# 从源代码同步到 Android 项目
npx cap sync android

# Android Studio 打包
# 打开 platforms/android/android/ 目录
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### 测试命令

```bash
# 运行所有测试
cd platforms/web
pytest

# 运行测试并显示覆盖率报告
pytest --cov=platforms/web/backend --cov-report=html

# 运行特定测试文件
pytest platforms/web/tests/test_questions.py

# 运行测试并显示详细输出
pytest -v
```

---

## 项目结构

```
dhu-Redlesson-Questionbank/
├── platforms/                 # 多平台代码根目录
│   ├── web/                   # Web版本 (Python Flask)
│   │   ├── main.py           # 主启动入口
│   │   ├── backend/          # Flask后端
│   │   ├── frontend/         # Web前端
│   │   └── static-site/      # 静态站点生成
│   ├── electron/              # 桌面版本 (Electron)
│   │   ├── main.js           # Electron主进程
│   │   ├── preload.js        # IPC脚本
│   │   ├── package.json
│   │   └── build/            # 打包配置
│   └── android/               # Android版本 (Capacitor)
│       └── android/          # Native Android Project
├── .github/                   # CI/CD配置
│   └── workflows/
│       ├── windows.yml       # Electron构建
│       └── android.yml       # Android构建
├── docs/                      # 项目文档
├── data/                      # 运行时数据
├── scripts/                   # 构建脚本
└── AGENTS.md                  # 本文件
```

---

## 关键文件位置

| 功能模块 | 文件路径 | 说明 |
|---------|---------|------|
| Web主入口 | `platforms/web/main.py:1` | 启动Flask服务器 |
| Flask应用 | `platforms/web/backend/app.py:1` | 后端核心配置 |
| 题目解析 | `platforms/web/backend/parser.py:1` | Word/Txt解析器 |
| 题库模型 | `platforms/web/backend/models/questions.py:1` | 题库CRUD |
| 刷题API | `platforms/web/backend/routes/practice.py:1` | 练习逻辑API |
| 前端主逻辑 | `platforms/web/frontend/js/app.js:1` | 页面路由和逻辑 |
| 练习模块 | `platforms/web/frontend/js/modules/practice.js:1` | 答题核心逻辑 |
| Android 前端源码 | `platforms/android/frontend/` | Capacitor 源代码目录 |
| Android 构建产物 | `platforms/android/android/app/src/main/assets/public/` | 由 sync 生成，Git 忽略 |

---

## Capacitor Android 开发流程

### ⚠️ 重要：正确的工作流程

**源代码位置**：`platforms/android/frontend/`（Git 跟踪）  
**构建产物位置**：`platforms/android/android/app/src/main/assets/public/`（Git 忽略）

### 开发步骤

1. **修改源代码**：
   ```bash
   # 编辑 frontend/ 中的文件
   code platforms/android/frontend/index.html
   code platforms/android/frontend/js/mobile.js
   ```

2. **同步到 Android 项目**：
   ```bash
   cd platforms/android
   npx cap sync android
   ```

3. **提交到 Git**：
   ```bash
   # 只提交源代码，不提交构建产物
   git add platforms/android/frontend/
   git commit -m "feat: 更新 Android 前端功能"
   ```

### 配置文件

**platforms/android/capacitor.config.json**：
```json
{
  "appId": "com.dhu.redlesson",
  "appName": "RedLesson",
  "webDir": "frontend"
}
```

**platforms/android/.gitignore**：
```gitignore
node_modules/
.idea/
# 不要忽略 frontend/（源代码）
```

**platforms/android/android/.gitignore**：
```gitignore
# 忽略构建产物
app/src/main/assets/public/
```

---

## 常见错误与解决方案

### 1. Capacitor 工作流程错误 ❌

**错误做法**：
- 将 `assets/public/` 当作源代码提交到 Git
- 忽略 `frontend/` 目录
- 手动编辑 `assets/public/` 文件

**后果**：
- `npx cap sync android` 报错 "Could not find web assets directory"
- 代码修改被 sync 覆盖
- Git 冲突频繁

**正确做法**：✅
- `frontend/` 是源代码（Git 跟踪）
- `assets/public/` 是构建产物（Git 忽略）
- 永远修改 `frontend/`，通过 `npx cap sync android` 同步

---

### 2. 删除功能模块后的残留调用 ❌

**案例**：删除设置页面（settings.js）

**错误做法**：
- 只删除 `<script src="js/modules/settings.js">`
- 忘记清理 `loadConfig()` 等函数调用

**后果**：
- 运行时报错 "loadConfig is not defined"
- 页面白屏或功能异常

**正确做法**：✅
1. 搜索所有调用点：`grep -r "loadConfig" frontend/js/`
2. 删除或注释所有调用
3. 检查 switch-case、事件监听器等隐蔽位置
4. 测试所有可能触发的代码路径

---

### 3. Git Ignore 配置混乱 ❌

**常见错误**：
- 全局忽略 `*.txt`，导致题库文件和 requirements.txt 无法提交
- 忽略 `tests/` 目录，导致测试代码丢失
- 忽略 `assets/public` 后又手动 `git add -f` 强制添加

**正确配置**：✅

**根目录 .gitignore**：
```gitignore
# Python
__pycache__/
*.pyc
.venv/

# 只忽略 uploads 目录的 txt 文件
uploads/*.txt

# 保留题库和依赖文件
!platforms/files/*.txt
!requirements.txt

# 测试相关（不要忽略 tests/ 目录）
.pytest_cache/
.coverage
htmlcov/
```

---

### 4. CI/CD 配置问题 ❌

**错误配置**：
- 缺少 `on: push/pull_request` 触发器
- Node.js 版本不匹配（Capacitor 5+ 需要 Node ≥18）
- 重复的 `publish` 配置导致构建失败

**正确配置**：✅

**.github/workflows/android.yml**：
```yaml
on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'  # Capacitor 要求
      
      - name: Sync Capacitor
        working-directory: ./platforms/android
        run: npx cap sync android
      
      - name: Build APK
        working-directory: ./platforms/android/android
        run: ./gradlew assembleDebug
```

---

### 5. 测试配置从零搭建 ⚠️

**需要的文件**：
- `platforms/web/requirements.txt`（添加 pytest 依赖）
- `platforms/web/pytest.ini`（pytest 配置）
- `platforms/web/tests/conftest.py`（fixtures 和路径设置）
- `platforms/web/tests/__init__.py`（包标识）

**常见坑**：
- 忘记 `sys.path.insert` 导致导入失败
- 测试文件命名不符合 `test_*.py` 规范
- fixtures 作用域设置错误

---

## 开发注意事项

### 环境依赖
- **Python**: 3.x
- **Windows + MS Word**: `.doc` 文件解析需要（pywin32 + COM接口）
- **跨平台**: `.docx` 和 `.txt` 格式跨平台兼容，推荐使用 TXT 格式
- **Node.js**: ≥18（Capacitor 5+ 要求）
- **Android**: JDK 21 + Gradle 8.14.3

### 题库格式规范
```
一、单项选择题
1、题目内容（A）
A. 选项A
B. 选项B
C. 选项C
D. 选项D

二、多项选择题
1、题目内容（ABC）
A. 选项A
B. 选项B
C. 选项C
D. 选项D
```

### 错误处理
- 后端返回标准格式: `{"success": true/false, "data/error": ...}`
- 前端使用 `showToast()` 函数显示提示信息
- 所有API调用使用 async/await 模式

---

## 测试最佳实践

1. **命名规范**:
   - 测试文件: `test_*.py`
   - 测试类: `Test*`
   - 测试函数: `test_*`

2. **使用 fixtures**:
   - 在 `conftest.py` 中定义共享的 fixtures
   - 使用 fixture 管理测试数据和客户端

3. **测试覆盖**:
   - 目标覆盖率: 80% 以上
   - 优先测试核心业务逻辑（模型、解析器）
   - 测试关键 API 端点

4. **测试隔离**:
   - 每个测试应该是独立的
   - 使用临时文件和目录
   - 清理测试产生的资源

---

## 参考资源

- Flask 文档: https://flask.palletsprojects.com/
- pytest 文档: https://docs.pytest.org/
- Capacitor 文档: https://capacitorjs.com/
- Electron 文档: https://www.electronjs.org/

---

**最后更新**: 2026-01-24

---

**最后更新**: 2026-01-24
