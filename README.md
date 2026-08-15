IT 刷题系统
一款纯前端、无后端、本地存储的 IT 刷题与模拟考试平台。支持单选、多选、判断、简答、编程题型，内置题库导入导出、错题本、收藏夹、数据统计、模拟考试、快捷键刷题等完整学习功能。全部数据本地存储，支持离线使用。


## 功能总览

平台包含首页、刷题练习、模拟考试、题库管理、错题本、我的收藏、数据统计、设置八大模块，提供刷题、考试、题目维护、学习数据分析、系统配置全套能力，支持响应式布局与页面动画交互。

## 核心技术

- 框架语言：Vue3.4 + TypeScript5.3，全部使用 `<script setup>` 组合式 API；Vite5.0 构建工具；Vue Router4.2 哈希路由；Pinia2.1 做状态管理
- Pinia 状态模块：question 题目题库、practice 刷题会话、exam 考试会话、stats 学习统计、settings 系统配置
- 样式：Tailwind CSS3.4，封装通用 UI 类，多断点响应式适配桌面与移动端
- 本地存储：idb8.x 操作 IndexedDB 存放业务数据；LocalStorage 保存配置，写入前做深拷贝规避 Proxy 克隆报错
- 解析能力：xlsx 解析 Excel、支持 JSON 题库导入，自动识别规范化题型答案
- 可视化：Chart.js+vue‑chartjs 实现图表，CSS 实现打卡热力图
- 组件：Monaco Editor 编程代码编辑器；lucide‑vue‑next 图标库按需引入

## 项目结构


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


## 默认快捷键

| 操作                  | 默认键位                     |
| ---                    | ---                             |
| 上一题               | ← (ArrowLeft)             |
| 下一题               | → (ArrowRight)          |
| 提交答案 		  | Enter                          |
| 显示 / 隐藏解析  | Space                         |
| 收藏 / 取消收藏  | F (KeyF)                      |
| 背题模式开关     | M (KeyM)                   |
| 选 A / B / C / D | 1 / 2 / 3 / 4 (Digit1–4) |