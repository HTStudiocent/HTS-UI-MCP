# Changelog

本项目所有重要变更都会记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.5.0] - 2026-10-18

### 新增（组件搜索）

- MCP 服务器新增第 9 个工具 `htsui_search_components`：按关键词搜索组件
  - 匹配字段：id（精确/前缀/包含）、中文名、说明、CSS 分组、源码内容
  - 相关度打分排序返回，标注每项命中位置；支持 `limit` 参数控制条数（默认 10）
  - 中英文关键词均可，如 "标签" / "tab" / "弹窗" / "modal"

### 新增（组件演示数据完善）

- 展示页 28 个组件全部补齐 CSS 代码框（含 15 个新组件的分组样式与 colors 主题变量），`data/components/*.html` 样例同步更新
  - MCP 侧 `htsui_get_component` 返回的 CSS 覆盖从「HTML 演示中出现的特征类」扩展为全量演示代码框，组件样式参考更完整
- 展示页 28 个组件全部可交互（点击/切换/拖动/复制等演示行为），并新增「历史更新记录」区块

### 变更（数据源仓库自带）

- 组件演示样例从「提取官网展示页网页源码」改为「仓库自带源文件」：
  - 新增 `data/components/` 目录，28 个组件各一个 `.html` 样例文件，作为组件演示的唯一维护入口
  - `build-data.js` 不再读取 `官网/ui/ui-content.js`，与网页完全脱钩；新增组件需在 `ORDER` 列表登记顺序
  - 切换后构建产物与之前逐字节一致（MD5 校验通过），运行时数据零变化

## [2.0.0] - 2026-10-17

### 新增（进度条交互）

- 可拖动进度条新增小球手柄 `.progress-thumb`：跟随填充末端显示当前位置
  - 默认隐藏缩小，悬停进度条或按住拖动时显现，拖动中放大 1.2 倍提供明确状态反馈
  - 小球使用 `--primary` / `--bg` 变量，浅色/深色主题自动适配
  - `.progress-drag` 改为 `overflow: visible`（原 `overflow: hidden` 会裁剪超出 6px 轨道的小球），`.progress-drag .progress-bar` 增加 `position: relative` 作为小球定位基准
  - JS 侧在 `pointerdown` / `pointerup` 时为容器添加/移除 `.dragging` 类驱动显隐与放大
  - 已同步纳入 `prefers-reduced-motion` 无障碍规则（开启减少动画时小球显隐无过渡）

### 新增（15 种组件）

- 面包屑 `.breadcrumb`：链接灰色悬停加深，末级 `.current` 加粗
- 分页 `.pagination`：当前页黑底高亮，`data-page` 按钮点击互斥切换，支持禁用态与省略号
- 标签页 `.tabs`：导航按钮与面板按顺序对应，交互自动绑定
- 折叠面板 `.accordion`：点标题开合本项，`open` 类默认展开，标题 ± 号随状态切换
- 步骤条 `.steps`：done / active / 默认三态，连接线自动染色
- 时间线 `.timeline`：左侧竖线自动连接节点，适合更新日志与动态流
- 头像 `.avatar`：文字/图片两种内容，sm/lg/square 变体，`.avatar-group` 自动叠放
- 骨架屏 `.skeleton`：line / avatar / block 三种形状，呼吸动画（减少动效偏好自动静止）
- 提示条 `.alert`：默认 / `strong` 左黑条 / `dark` 黑底白字三级强度
- 空状态 `.empty`：图标 + 标题 + 说明
- 加载中 `.spinner`：环形动画，sm / 默认 / lg 三档，纯 CSS
- 文字提示 `[data-tip]`：纯 CSS 气泡，悬停与键盘聚焦触发，`tip-bottom` 朝下弹出
- 下拉菜单 `.dropdown`：`.dropdown-toggle` 开合，点击外部或 ESC 自动关闭，同页互斥
- 分段控制 `.segmented`：紧凑互斥切换组，交互自动绑定
- 列表组 `.list-group`：主文字 + 副行 + 右侧信息，自动分隔线与悬停底色
- 行为层新增 `initTabs` / `initAccordions` / `initDropdowns` / `initSegmented` / `initPagination`，全部并入 `HTSUI.init()`，沿用 `dataset.htsBound` 防重复绑定
- 所有新组件颜色均走 CSS 变量，深浅主题自动适配；展示页新增 15 个演示区块

### 新增（MCP 2.0 分发）

- 仓库定位改为 HTS UI MCP 2.0：源码仓库以 MCP 服务器为主体分发，组件库源码（dist）作为数据构建源保留
  - `hts-ui-mcp.js`（根目录）：零依赖 stdio JSON-RPC（MCP 协议 2024-11-05），Node ≥16 直接运行
  - 8 个工具：`htsui_overview` / `list_components` / `get_component`（HTML+CSS+JS 全源码）/ `get_page_template`（桌面/平板/手机响应式页面骨架）/ `theme` / `responsive` / `animations` / `get_file`（dist 原文）
  - `build-data.js`：数据构建脚本，从 `dist/hts-ui.css`、`dist/hts-ui.js` 与展示页 `ui-content.js` 代码框提取，保证 MCP 数据与库实现逐行一致
  - `data/hts-ui.json`：28 组件 × (HTML 样例 + dist 原文 CSS 规则组 + 交互 JS) + 主题变量 + 5 断点响应式 + 动效无障碍规范快照
  - 移除组件库示例页 example.html；README 重写为 MCP 项目文档（保留 dist 直接引入的传统用法说明）
- 展示页下载按钮文案更新：「Gitee MCP 源码下载（国内）」「GitHub MCP 源码下载（国外）」，描述行升级为 HTS UI MCP 2.0

## \[1.0.0] - 2026-10-11

### 新增

- 主题系统：浅色 / 深色 / 跟随系统三态，CSS 变量驱动，localStorage 持久化，防闪烁内联脚本方案
- 基础组件：按钮（主要/次要/小号/禁用）、输入框、下拉框（自绘箭头）、文本域、复选框、开关
- 展示组件：卡片、标签徽章、表格（含防溢出容器）、分割线、进度条（含可拖动变体）、代码框（行号/折叠/复制）
- 反馈组件：弹窗（遮罩淡入 + 卡片缩放）、Toast 提示
- 导航组件：顶部导航栏（吸顶、下划线展开动效、深浅双 Logo）、侧边导航栏（桌面可缩回、窄屏抽屉式）
- 页脚组件
- 响应式适配：900px / 640px / 400px / 360px / 800px 断点
- 无障碍：`prefers-reduced-motion` 自动关闭动效
- JS 行为层：`HTSTheme` 主题模块 + `HTSUI.init()` 一键绑定全部组件交互

