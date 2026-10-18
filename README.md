# HTS UI MCP 2.5

> HTS UI 组件库源码 MCP 服务器 · 零依赖 · 黑白灰 · 简约扁平 · 浅色/深色/跟随系统
>
> 作者：HTStudiocent · 许可：MIT · 展示页：https://www.haotis.top/ui/

本仓库以 **MCP（Model Context Protocol）服务器**的形式分发 HTS UI 组件库：任意 AI 编码客户端（Trae / Claude Desktop / Cursor / Cline 等）接入后，可直接获取全部 **28 个组件**的 HTML 结构、CSS 规则（`dist/hts-ui.css` 原文）、交互 JS（`dist/hts-ui.js` 原文）、主题系统、**桌面/平板/手机全断点响应式规则**与动效无障碍规范，AI 依此生成的页面天然符合 HTS 设计规范。

## 快速开始

把仓库下载到本地（`git clone` 或 Releases 下载源码），在客户端 MCP 配置里加一条：

```json
{
  "mcpServers": {
    "hts-ui": {
      "command": "node",
      "args": ["D:/HTS-UI/hts-ui-mcp.js"]
    }
  }
}
```

- **Trae**：设置 → MCP → 添加，粘贴上面配置（路径改成你的实际位置）
- **Claude Desktop**：`claude_desktop_config.json` 中同结构
- **Cursor**：Settings → MCP → Add，同结构

无需 `npm install`，无任何依赖，Node ≥ 16 即可运行。

## 工具一览（9 个）

| 工具 | 作用 |
|---|---|
| `htsui_overview` | 库总览 + 引入方式 + API + 全部组件清单 |
| `htsui_list_components` | 28 个组件的 id/名称/说明 |
| `htsui_get_component` | 单个组件完整源码（HTML + dist 原文 CSS + 交互 JS） |
| `htsui_search_components` | 关键词搜索组件（id/中文名/说明/CSS 分组/源码，相关度排序） |
| `htsui_get_page_template` | 完整响应式页面骨架（head 防闪烁 + 导航/主体/页脚/弹窗） |
| `htsui_theme` | 主题系统：:root/深色变量、HTSTheme API、防闪烁、防卡顿 |
| `htsui_responsive` | 全部 @media 断点原文（800/900/640/400/360） |
| `htsui_animations` | 动效基准 + prefers-reduced-motion 无障碍 + 行为索引 |
| `htsui_get_file` | 整份 `dist/hts-ui.css` 或 `dist/hts-ui.js` 原文 |

对话示例：

> 用 HTS UI 组件库做一个深色模式支持的产品落地页
> → AI 自动调用 overview / page_template / theme / get_component 生成
>
> 有没有标签类的组件？
> → AI 调用 search_components("标签") 命中 tags / tabs，再取源码使用

## 直接引入组件库（不经 MCP 的传统用法）

1. 复制 `dist/hts-ui.css` 与 `dist/hts-ui.js` 到项目
2. `<link rel="stylesheet" href="dist/hts-ui.css">`
3. `<script src="dist/hts-ui.js"></script>`（自动应用主题并调用 `HTSUI.init()`）
4. 主题 API：`HTSTheme.getMode() / setMode(mode) / apply()`；组件 API：`HTSUI.toast(msg)`、`HTSUI.openModal(id)`、`HTSUI.closeModal(id)`
5. 声明式：按钮加 `data-hts-modal="弹窗id"` 即开弹窗；`.theme-select` 自动接管主题下拉
6. 防闪烁：`<head>` 内联读取 `localStorage['hts-theme']` 提前设置 `data-theme`（见 `htsui_theme` 工具返回的原文）

组件清单：色彩变量、字体、按钮、表单控件（输入/下拉/文本域/复选/开关）、卡片、标签徽章、表格、弹窗、Toast、进度条（含拖动小球）、代码框、顶部导航、侧边导航、页脚 + 面包屑、分页、标签页、折叠面板、步骤条、时间线、头像、骨架屏、提示条、空状态、加载中、文字提示、下拉菜单、分段控制、列表组。

## 仓库结构

```
HTS-UI/
├── hts-ui-mcp.js   # MCP stdio 服务器（零依赖，换行分隔 JSON-RPC 2.0）
├── build-data.js   # 数据构建：dist + data/components 样例 → data/hts-ui.json
├── data/
│   ├── hts-ui.json # 全量组件数据快照（服务器唯一运行时依赖）
│   └── components/ # 28 个组件演示样例源文件（仓库自带，维护入口，不依赖网页）
├── dist/
│   ├── hts-ui.css  # 组件库样式（数据源，也可直接引入）
│   └── hts-ui.js   # 组件库行为层
├── CHANGELOG.md
├── LICENSE
└── package.json
```

## 组件库更新后重新生成数据

在仓库根目录执行：

```bash
node build-data.js
```

脚本读取 `dist/hts-ui.css`、`dist/hts-ui.js` 与仓库自带的 `data/components/*.html` 样例，重新生成 `data/hts-ui.json`，保证 MCP 数据与库实现逐行一致。新增/修改组件时：编辑 `data/components/` 下对应 `.html` 文件（新增组件还需在 `build-data.js` 的 `ORDER` 列表登记顺序），再执行构建。

## 许可

MIT，可自由商用。展示与交互演示见 https://www.haotis.top/ui/
