# IT 刷题系统

一套纯前端、零后端、本地存储的 IT 知识刷题与模拟考试平台。支持单选题 / 多选题 / 判断题 / 简答题 / 编程题（代码编辑器），涵盖题库导入导出、错题本、收藏夹、数据统计、模拟考试、快捷键刷题等完整学习闭环。所有数据保存在浏览器本地，可离线使用。

---

## 🎯 功能总览

### 1. 首页 (Home)
- 渐变 Hero 横幅：个性化欢迎语 + 「开始刷题」/「模拟考试」双 CTA
- **4 项核心数据看板**（复用 `statCards`）：总题数、已练习题数、正确率、连续打卡天数
- **刷题模式**四选一卡片：顺序刷题 / 随机刷题 / 错题重刷 / 收藏刷题
- **今日进度条**：默认每天 50 题目标，实时显示完成进度和剩余题数
- **快速入口**：错题本（错题数量徽章）、我的收藏（收藏数量徽章）、学习数据

### 2. 刷题练习 (Practice)
- **模式选择器**（首次进入 / 返回时显示）
  - 选择题库（多选，勾选式 chip）：可跨多个题库联合练习
  - 选择题型（多选）：单选 / 多选 / 判断 / 简答 / 编程
  - 4 个模式卡片：顺序 / 随机 / 错题 / 收藏
- **答题界面**
  - 题型标签 + 收藏按钮（⭐ 空心 / 实心切换）
  - 题干渲染
  - 选项渲染（单选 / 多选 / 判断 → `OptionList` 组件；简答 → textarea；编程 → `CodeEditor` 组件）
  - 提交后即时判分：正误选项高亮、正确/错误反馈图标
  - 答案解析面板（可折叠）：题型、难度、分类、正确答案、解析文字、知识点标签
  - 背题模式开关：显示题时自动展开解析
  - 「上一题 / 提交答案 / 下一题」按钮条
- **题目列表抽屉**（右侧滑出）：5 列宫格题号，当前题高亮，支持任意跳题
- **快捷键监听**：全局 `keydown` 事件，input/textarea 内自动屏蔽
- 支持从 URL query 参数自动进入模式：`?mode=wrong&bankId=1&types=single`

### 3. 模拟考试 (Exam)
- **考试参数配置页**
  - 题目数量（1–200）、考试时长（1–180 分钟）
  - 题型多选 chip、题库多选 chip
  - 难度范围双滑块（1–5 星）
- **考试进行页**
  - 顶部粘性操作栏：倒计时（<5 分钟红色警示）、当前题号 / 总题数、已答题数
  - 「答题卡」按钮 + 「交卷」按钮
  - 答题区：与 Practice 相同的题型渲染 + CodeEditor
  - 上一题 / 下一题导航
- **答题卡抽屉**（右侧滑出）：5 列宫格，当前题高亮 + 已答题绿色标记，底部一键交卷
- **交卷结果页**
  - 大号分数展示 + 满分 100 分说明
  - 四格统计：总题数 / 答对（绿） / 答错（红） / 未答（灰）
  - 操作按钮：查看答卷 / 再考一次 / 返回首页
- **答卷详情**（底部弹出抽屉）
  - 每题显示：题号、题型标签、正误徽章
  - 选项渲染：正确项绿色、错选项红色、其余灰色
  - 简答题：你的答案 + 正误判断
  - 编程题：你的代码（monospace 预格式化）
  - 正确答案 + 解析

### 4. 题库管理 (Questions)
- **双 Tab 视图切换**
  - 题库列表 / 题目列表（Tab 下方带 `border-b-2` 高亮）
- **题库列表视图**
  - 6 个预置种子题库（Web 前端 / Web 进阶 / 算法 / 数据库 / 网络 / 操作系统）
  - 题库卡片：名称、题数、创建日期
  - 悬浮操作：多选勾选、更多菜单（重命名 / 删除）
  - 点击卡片 → 切换「只看该题库」筛选模式，底部出现「查看全部题库」虚线卡片取消筛选
  - 多选批量删除（顶部出现「删除选中」红色按钮）
- **题目列表视图**
  - 搜索框（题干 / 解析 / 标签模糊匹配）
  - 题库下拉筛选 + 题型下拉筛选
  - 题目卡片：题型标签（彩色）、难度星级、题干截断、标签 hashtag
  - 每行操作：修改（✏️）/ 删除（🗑️）
  - 分页：每页 50 条，上一页 / 下一页
- **编辑题目弹窗**（居中 Modal）
  - 题型选择（下拉）、题干 textarea、选项 textarea（每行一个）、正确答案输入、解析 textarea、难度选择
  - 保存修改 / 取消
- **导入题库弹窗**
  - 题库名称（必填，默认取文件名）+ 题库描述（选填）
  - 拖拽上传区域（drag-over 高亮）+ 点击选择文件
  - 支持 `.xlsx` / `.xls` / `.json`
  - 导入进度条（spinner + 百分比 + 完成勾）
- **导出题库**：一键下载 JSON 备份

### 5. 错题本 (WrongBook)
- 顶部标题：错题数统计 + 「开始重刷」按钮
- 筛选条件：题库下拉 + 题型下拉
- 错题卡片列表（按最后错误时间倒序）
  - 左侧圆形「错 N」徽章（红色背景）
  - 题型标签 + 所属题库标签 + 最近错误时间
  - 题干截断（120 字符）
  - 题目已删除时显示「题目已删除」灰色提示
- 空状态：绿色庆祝图标 + 「太棒了！暂无错题」+ 去刷题按钮

### 6. 我的收藏 (Favorites)
- 顶部标题：收藏数统计 + 「开始练习」按钮
- 题型筛选下拉
- 收藏卡片列表（按收藏时间倒序）
  - 左侧星形图标（琥珀色）
  - 题型标签 + 收藏日期
  - 题干截断（120 字符）
- 空状态：空心星形图标 + 「暂无收藏」+ 去刷题按钮

### 7. 数据统计 (Statistics)
- **4 项关键指标**（复用 `statCards`，带彩色图标）
- **近 7 天刷题趋势柱状图**（Chart.js Bar）
- **题型分布环形图**（Chart.js Doughnut，65% 切割率）
- **打卡日历热力图**
  - 月份切换（◀ ▶ 按钮）
  - 7 列星期表头（日 / 一 / 二 / 三 / 四 / 五 / 六）
  - 5 档颜色强度（0 / 1–9 / 10–29 / 30–49 / 50+ 题）
  - 图例条（少 → 多）
- **累计数据卡**：连续打卡天数 / 总打卡天数 / 错题数 / 收藏数

### 8. 设置 (Settings)
- **外观设置卡片**
  - 深色模式开关（圆形 toggle，滑块动画）
  - 字体大小：4 档按钮（14 / 16 / 18 / 20 px），选中态高亮
- **快捷键卡片**
  - 10 项快捷键列表（标签 + 描述 + 当前键位 `<kbd>` 标签）
  - 右上角「重置」按钮 → `settingsStore.resetShortcuts()`
- **数据管理卡片**
  - 导出数据（下载 `刷题数据备份_YYYY-MM-DD.json`）
  - 导入题库（跳转到 /questions）
  - 清空所有数据（红色文字 + 双重 confirm 弹窗）
- **关于卡片**：版本号、技术栈、数据存储方式

### 9. 通用体验
- 响应式布局：桌面端左侧栏（8 项导航）+ 顶部搜索框 / 主题切换；移动端底部 5 项 Tab 导航 + 侧边栏折叠为左侧抽屉
- 全局亮 / 暗主题（Tailwind `dark:` 变体 + `document.documentElement.classList` 切换）
- 字体大小全局生效（`document.documentElement.style.fontSize`）
- 所有弹窗使用 `Teleport to="body"` + `Transition` 动画（fade / slide-right / slide-up）
- 页面切换带 `fade` 过渡（router `out-in` 模式）
- 路由标题拦截器：`document.title = "${title} - IT刷题"`
- 快捷键全局支持（input / textarea focus 时自动屏蔽）

---

## 🏗️ 核心技术

### 前端框架与语言
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4 | 全量使用 `<script setup>` 组合式 API |
| TypeScript | 5.3 | 严格类型约束，所有数据模型均有 interface |
| Vite | 5.0 | 开发服务器 + 生产构建 |
| Vue Router | 4.2 | 基于 Hash 的 8 个页面路由 |
| Pinia | 2.1 | 5 个业务 Store 拆分状态 |

### 状态管理（Pinia Stores）
- **question.ts** — 题目 / 题库 / 分类 / 标签 CRUD，分页、搜索、文件导入导出、错题 / 收藏 ID 聚合
- **practice.ts** — 刷题会话：模式初始化、题号流、选项选择、答案提交判分、每日统计 + 打卡、错题 / 收藏写入、背题模式
- **exam.ts** — 考试会话：参数筛选抽题、倒计时定时器、答题记录、自动交卷算分
- **stats.ts** — 统计加载、正确准确率计算、近 N 天数据聚合、日历热力图生成
- **settings.ts** — 主题切换（操作 `documentElement.classList`）、字体大小（写入 CSS 变量）、快捷键 CRUD

### 样式
- **Tailwind CSS 3.4**：原子化样式，自定义 primary / success / danger / warning 主题色
- **自定义组件类**（`@layer components`）：`btn-primary / btn-secondary / btn-danger / btn-ghost / card / card-hover / input / tag-blue / tag-gray / tag-green / tag-amber / progress-bar` 等统一复用
- 响应式：`sm / md / lg` 三档断点；移动端底部导航 + 侧边栏抽屉

### 本地存储
| 层 | 技术 | 存储内容 |
|----|------|----------|
| IndexedDB | `idb` 8.x (Promise 封装) | 题目、题库、练习记录、错题、收藏、笔记、每日统计、标签 |
| LocalStorage | 原生 `JSON.parse/stringify` | 用户配置（主题、字体、快捷键）、打卡日期数组、最后练习位置 |

**IndexedDB 8 个对象存储**：
`questions` / `questionBanks` / `practiceRecords` / `wrongQuestions` / `favorites` / `notes` / `dailyStats` / `tags`

> ⚠️ 所有写操作通过 `JSON.parse(JSON.stringify(obj))` 深拷贝后再写入，避免 Vue 3 的 reactive Proxy 对象触发 IndexedDB 的 `DataCloneError`。

### 题目解析器 (questionParser.ts)
- **Excel**：基于 `xlsx` 库，自动识别列名（支持中文 / 英文列名：题型 / type、题目 / content、A-H 选项列、答案 / answer、解析、难度、标签…）
- **JSON**：支持数组根节点或 `{ questions: [] }` 两种结构
- 智能题型推断：根据答案格式 + 选项列自动判断
- 答案规范化：单选取首字母大写、多选去重排序、判断题统一为「正确 / 错误」

### 可视化
- **Chart.js 4.4** + **vue-chartjs 5.3**：7 天柱状趋势图、题型环形图
- 日历热力图：纯 CSS Grid + Tailwind 渐变色

### 代码编辑器
- **Monaco Editor 0.45**：编程题作答界面，支持自定义 dark 主题、语言切换、只读模式、TabSize 2、自动换行

### 图标
- **lucide-vue-next**：统一图标库，按需 tree-shaking

---

## 📁 项目结构

```
it-quiz/
├── public/
│   └── favicon.svg                  # 站点图标
├── src/
│   ├── assets/
│   │   └── vue.svg                  # Vue 资源
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue       # 左侧导航栏（8 项路由）
│   │   │   ├── AppHeader.vue        # 顶部栏（搜索框 + 主题切换）
│   │   │   └── AppBottomNav.vue     # 底部 Tab 导航（移动端 5 项）
│   │   └── question/
│   │       ├── OptionList.vue       # 选项渲染（单选/多选/判断通用）
│   │       ├── ExplanationPanel.vue # 答案解析面板
│   │       └── CodeEditor.vue       # Monaco 代码编辑器（编程题）
│   ├── composables/
│   │   └── useIndexedDB.ts          # IndexedDB 全部操作封装
│   │   ├── pages/
│   │   │   ├── Home.vue             # 首页（看板+模式选择+进度）
│   │   │   ├── Practice.vue         # 刷题练习（4 模式+答题+解析）
│   │   │   ├── Exam.vue             # 模拟考试（配置+计时+答卷）
│   │   │   ├── Questions.vue        # 题库管理（双 Tab+CRUD+导入导出）
│   │   │   ├── WrongBook.vue        # 错题本（筛选+重刷入口）
│   │   │   ├── Favorites.vue        # 收藏夹（筛选+练习入口）
│   │   │   ├── Statistics.vue       # 数据统计（图表+日历热力图）
│   │   │   └── Settings.vue         # 设置（外观+快捷键+数据管理+关于）
│   │   ├── router/
│   │   │   └── index.ts             # Hash 路由 + 标题拦截器
│   │   ├── stores/
│   │   │   ├── question.ts          # 题目/题库/分类/标签状态
│   │   │   ├── practice.ts          # 刷题会话状态
│   │   │   ├── exam.ts              # 考试会话状态
│   │   │   ├── stats.ts             # 统计数据状态
│   │   │   └── settings.ts          # 设置状态（主题/字体/快捷键）
│   │   ├── types/
│   │   │   └── index.ts             # 全局类型定义（Question/Bank/ExamConfig 等）
│   │   ├── utils/
│   │   │   ├── constants.ts         # 共享常量+工具函数（类型映射/统计卡片/导航项）
│   │   │   ├── questionParser.ts    # Excel/JSON 题目解析+下载
│   │   │   └── storage.ts           # LocalStorage 封装（配置/打卡/连续天数）
│   │   ├── App.vue                  # 根组件（整体布局）
│   │   ├── main.ts                  # 应用入口（Pinia+Router 挂载）
│   │   ├── style.css                # Tailwind 指令+自定义组件类+滚动条
│   │   └── vite-env.d.ts            # Vite 环境类型声明
├── index.html                       # Vite 入口 HTML
├── vite.config.ts                   # Vite + Vue 插件配置
├── tailwind.config.js               # 自定义主题色/字体/content 范围
├── postcss.config.js                # Tailwind + Autoprefixer
├── tsconfig.json                    # TypeScript 配置（路径别名 @ = src）
├── package.json                     # 项目依赖与脚本
├── package-lock.json                # 依赖锁定
└── .gitignore                       # Git 忽略规则
```

---

## 🚀 部署

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 3. 类型检查
npm run check

# 4. ESLint 检查 / 自动修复
npm run lint
npm run lint:fix
```

### 生产构建

```bash
# 1. 构建（先跑 vue-tsc 类型检查，再 Vite 打包）
npm run build
# 产物输出到 dist/

# 2. 本地预览构建产物（默认 http://localhost:4173）
npm run preview
```

### 生产部署（纯静态）

**本项目为 100% 前端 SPA（无任何后端接口）**，`dist/` 目录下是纯静态资源，可部署到任意静态托管：

| 方式 | 步骤 |
|------|------|
| **Nginx** | 把 `dist/` 拷贝到 `/usr/share/nginx/html/it-quiz/`，由于项目使用 Hash 路由，只需确保 `index.html` 可访问即可，无需 rewrite 规则 |
| **GitHub Pages / Gitee Pages** | 仓库 Settings → Pages → 选择分支 + `dist/` 目录（或用 Actions 上传） |
| **Vercel / Netlify / Cloudflare Pages** | 连接仓库，Framework 选择 Vite，Build Command `npm run build`，Output Directory `dist` |
| **对象存储 + CDN**（OSS / COS / OBS / S3） | 将 `dist/` 静态上传，开启静态网站托管 |
| **本地双击运行** | 可直接双击 `dist/index.html`（Hash 路由不依赖服务器重写） |

> 💡 数据完全保存在用户浏览器，跨设备不共享。如需备份数据，可通过「设置 → 导出数据」生成 JSON 文件，迁移时再导入。

---

## 🔧 依赖清单

```json
{
  "dependencies": {
    "chart.js": "^4.4.1",
    "clsx": "^2.1.1",
    "highlight.js": "^11.9.0",
    "idb": "^8.0.0",
    "lucide-vue-next": "^0.511.0",
    "monaco-editor": "^0.45.0",
    "pinia": "^2.1.7",
    "tailwind-merge": "^3.3.0",
    "vue": "^3.4.15",
    "vue-chartjs": "^5.3.0",
    "vue-router": "^4.2.5",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.49.0",
    "eslint-plugin-vue": "^9.18.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}
```

### npm scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（5173） |
| `npm run build` | 类型检查 + Vite 生产构建 |
| `npm run preview` | 预览构建产物（4173） |
| `npm run check` | 仅执行 vue-tsc 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |

---

## ⌨️ 默认快捷键

| 操作 | 默认键位 |
|------|----------|
| 上一题 | ← (ArrowLeft) |
| 下一题 | → (ArrowRight) |
| 提交答案 | Enter |
| 显示/隐藏解析 | Space |
| 收藏 / 取消收藏 | F (KeyF) |
| 背题模式开关 | M (KeyM) |
| 选 A / B / C / D | 1 / 2 / 3 / 4 (Digit1–4) |

所有快捷键可在设置页「快捷键」卡片查看当前值，通过「重置」按钮一键还原默认。

---

## 📦 数据备份与迁移

1. **导出全部配置**：`设置 → 数据管理 → 导出数据` → 下载 `刷题数据备份_YYYY-MM-DD.json`（包含主题、字体、快捷键、打卡记录、最后练习位置）
2. **迁移题目**：`题库管理 → 导出题库` 下载 JSON 文件，在另一台设备的 `题库管理 → 导入题库` 导入
3. **清空重置**：`设置 → 数据管理 → 清空所有数据`（双重 confirm 确认弹窗，清空 IndexedDB + LocalStorage 全部数据）

---

## 🐛 已知注意事项

1. Monaco Editor 打包 chunk 较大（约 3 MB），已被 Vite 自动分包，按需加载不影响首屏。
2. 所有题目与数据保存在当前浏览器的 IndexedDB / LocalStorage，**清除浏览器数据会导致丢失**，请定期导出备份。
3. 首次打开会自动注入 6 个示例题库（不含题目），导入 Excel / JSON 后题目数量会自动更新。
4. Excel 导入支持 `.xlsx` / `.xls` 格式，需包含「题目内容」列，答案列自动推断。
5. 简答题和编程题的判分采用关键词匹配逻辑，非严格全文一致。
