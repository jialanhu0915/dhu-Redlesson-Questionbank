# AGENTS.md

## 项目概述

**项目名称**: DHU 红课题库刷题系统

**项目描述**: 基于 Web 的题库刷题系统，支持多格式题库导入、多种练习模式、可在局域网内多设备访问。

**技术栈**:
- 后端: Flask (Python)
- 前端: HTML5 + CSS3 + Vanilla JavaScript
- 文档解析: python-docx, pywin32
- 数据存储: JSON 文件

**适用场景**: 大学政治科学课程（习概/毛概/思修/近代史）题库练习

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

### Electron 桌面应用开发

> 详细实施计划请参考 [docs/ELECTRON_PLAN.md](docs/ELECTRON_PLAN.md)

#### 环境设置

```bash
# 进入 electron 目录
cd platforms/electron

# 安装 Node.js 依赖
npm install

# 验证安装
npm run start
```

#### 开发模式运行

```bash
# 进入 electron 目录
cd platforms/electron

# 开发模式运行（会自动打开 DevTools）
npm run dev
```

#### 打包命令

```bash
# 进入 electron 目录
cd platforms/electron

# 打包 Windows 版本
npm run build:win

# 打包 macOS 版本
npm run build:mac

# 打包所有版本
npm run build:all
```

#### 打包产物

- Windows: `dist/东华红课题库刷题系统-1.0.0-setup.exe`
- macOS: `dist/东华红课题库刷题系统-1.0.0.dmg`

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
| Electron主进程 | `platforms/electron/main.js:1` | 桌面端入口 |
| Electron构建 | `platforms/electron/build/builder-win.yaml` | Windows打包配置 |
| Android构建 | `.github/workflows/android.yml` | Android CI配置 |

---

## API端点

### 健康检查
- `GET /api/health` - 健康检查接口

### 题库管理
- `GET /api/banks` - 获取所有题库列表
- `POST /api/banks` - 导入新题库（上传文件）
- `DELETE /api/banks/<bank_name>` - 删除指定题库
- `GET /api/chapters` - 获取题库的章节列表

### 题目管理
- `GET /api/questions` - 获取题目列表（支持bank、chapter参数筛选）
- `GET /api/questions/<question_id>` - 获取指定题目详情

### 刷题功能
- `GET /api/practice/random` - 随机抽题练习
  - 参数: `bank`, `chapter`, `type`, `count`, `single_count`, `multi_count`
- `GET /api/practice/sequence` - 顺序做题
  - 参数: `bank`, `chapter`, `shuffle`
- `GET /api/practice/wrong` - 错题练习
  - 参数: `bank`, `single_count`, `multi_count`
- `POST /api/practice/check` - 检查答案
  - 参数: `question_id`, `answer`

### 错题本
- `GET /api/wrongbook` - 获取错题列表
  - 参数: `bank`（按题库筛选）
- `POST /api/wrongbook` - 添加错题
- `DELETE /api/wrongbook/<question_id>` - 删除错题

### 排行榜
- `GET /api/rankings` - 获取排行榜
- `POST /api/rankings` - 提交成绩

### 进度管理
- `GET /api/progress` - 获取进度列表
- `POST /api/progress` - 保存进度
- `DELETE /api/progress/<id>` - 删除进度

### 统计
- `GET /api/stats` - 获取题目统计信息
  - 参数: `bank`, `chapter`

### 配置
- `GET /api/config` - 获取配置信息
- `POST /api/config` - 更新配置

### 客户端信息
- `GET /api/client/info` - 获取客户端信息（IP地址等）

---

## 开发注意事项

### 环境依赖
- **Python**: 3.x
- **Windows + MS Word**: `.doc` 文件解析需要（pywin32 + COM接口）
- **跨平台**: `.docx` 和 `.txt` 格式跨平台兼容，推荐使用 TXT 格式

### 数据存储
- 所有数据以 JSON 格式存储在 `data/` 目录
- 数据文件由 Python 后端管理，使用文件锁避免并发冲突
- 静态版本使用浏览器 localStorage，数据不同步

### 网络访问
- **本机**: `http://127.0.0.1:50000`（无需配置）
- **局域网**: `http://192.168.x.x:50000`（运行 `setup_firewall.bat`，管理员权限）
- **热点**: `http://192.168.137.1:50000`（运行 `防火墙开关.bat` 关闭防火墙）

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

### 文件上传限制
- 允许的文件类型: `.doc`, `.docx`, `.txt`
- 上传目录: `uploads/`（临时存储）
- 推荐文件大小: 小于 10MB

### 前端模块化
- 使用原生 JavaScript ES6 模块
- 主文件: `frontend/js/app.js`
- 功能模块: `frontend/js/modules/*.js`
- CSS文件: `frontend/css/style.css` (桌面) + `mobile.css` (移动端)

### 错误处理
- 后端返回标准格式: `{"success": true/false, "data/error": ...}`
- 前端使用 `showToast()` 函数显示提示信息
- 所有API调用使用 async/await 模式

### Electron 桌面应用

> **重要**: 请参考 [docs/ELECTRON_PLAN.md](docs/ELECTRON_PLAN.md) 了解详细的 Electron 改造计划。

#### 架构说明
- **离线优先**: Electron 版本完全离线运行，不需要服务器
- **IPC 通信**: 前端通过 IPC 与主进程通信，不再依赖 HTTP API
- **数据存储**: 数据存储在用户目录下的 `Application Support` 文件夹
- **Python 集成**: Word 文档解析使用内嵌 Python 运行时
  - 依赖库: `python-docx==1.1.0`, `lxml==5.1.0`, `pywin32==306`（仅 Windows）
  - Windows 平台支持 .doc 和 .docx 文件
  - macOS/Linux 平台仅支持 .docx 文件

#### 改造状态
- [ ] 阶段一：Electron 基础架构搭建（待实施）
- [ ] 阶段二：Windows 打包与测试（待实施）
- [ ] 阶段三：macOS 打包与测试（待实施）
- [ ] 阶段四：PWA 离线支持（待实施）
- [ ] 阶段五：移动端优化（可选，待实施）

---

## 测试配置添加指南

### 当前状态
项目目前**没有**任何测试配置和测试文件。

### 步骤 1: 安装测试依赖

在 `platforms/web/requirements.txt` 中添加以下依赖：

```txt
# Web 框架
Flask>=3.0.0
Flask-Cors>=4.0.0

# Word 文档解析
python-docx>=1.1.0

# Windows COM 支持（用于读取 .doc 文件）
pywin32>=306; sys_platform == "win32"

# 测试框架（新增）
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-flask>=1.2.0
pytest-mock>=3.11.0
```

安装新依赖：

```bash
cd platforms/web
pip install -r requirements.txt
```

### 步骤 2: 创建测试目录结构

```bash
# 创建 tests 目录
mkdir platforms/web/tests
```

### 步骤 3: 创建测试配置文件

创建 `tests/__init__.py`:

```python
"""
测试包初始化
"""
```

创建 `platforms/web/tests/conftest.py`:

```python
"""
pytest 配置文件
"""

import pytest
import sys
import os
import json
import tempfile

# 确保backend目录在路径中
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app
```

### 步骤 4: 创建解析器测试

创建 `platforms/web/tests/test_parser.py`:

```python
"""
题目解析器测试
"""

import pytest
import os
import tempfile
from parser import parse_docx, parse_txt
```

### 步骤 5: 创建模型测试

创建 `platforms/web/tests/test_models.py`:

```python
"""
数据模型测试
"""

import pytest
import json
import os
import tempfile
from models.questions import QuestionsModel
```

### 步骤 6: 创建路由测试

创建 `platforms/web/tests/test_routes.py`:

```python
"""
API路由测试
"""
```

### 步骤 7: 创建 pytest 配置文件

在 `platforms/web/` 目录创建 `pytest.ini`:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --tb=short
markers =
    unit: 单元测试
    integration: 集成测试
    api: API测试
```

### 步骤 8: 更新 .gitignore

确保 `.gitignore` 包含测试生成的文件：

```gitignore
# 测试相关
.pytest_cache/
.coverage
htmlcov/
*.cover
.hypothesis/
```

### 步骤 9: 运行测试

```bash
cd platforms/web

# 运行所有测试
pytest

# 运行测试并显示详细输出
pytest -v

# 运行测试并生成覆盖率报告
pytest --cov=backend --cov-report=html

# 运行特定测试文件
pytest tests/test_parser.py

# 运行特定测试函数
pytest tests/test_models.py::test_get_all_questions

# 显示打印输出
pytest -s
```

### 步骤 10: 在 CI/CD 中使用测试

创建 `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.8', '3.9', '3.10', '3.11']

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}

    - name: Install dependencies
      working-directory: ./platforms/web
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Run tests
      working-directory: ./platforms/web
      run: |
        pytest --cov=backend --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

### 测试最佳实践

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

5. **持续集成**:
   - 在 GitHub Actions 中自动运行测试
   - 提交前本地运行测试

---

## 常见问题 (FAQ)

> 待添加...

---

## 开发工作流程

> 待添加...

---

## 代码风格指南

> 待添加...

---

## 部署说明

> 待添加...

---

## 附录

### 参考资源
- Flask 官方文档: https://flask.palletsprojects.com/
- pytest 文档: https://docs.pytest.org/
- Python 编码规范 (PEP 8): https://pep8.org/

### 许可证
MIT License

---

**最后更新**: 2026-01-23
