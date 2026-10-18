#!/usr/bin/env node
/* ============================================================
   HTS UI MCP 2.5 · 零依赖组件库源码服务器
   Author: HTStudiocent · MIT · 展示: https://www.haotis.top/ui/

   用途：让任意 AI 编码客户端（Trae / Claude Desktop / Cursor 等）
   直接获取 HTS UI 全部组件的 HTML/CSS/JS 源码、主题系统、
   响应式断点（桌面/平板/手机）与动效规范。

   运行：node hts-ui-mcp.js（stdio 协议，无需任何依赖）
   数据：data/hts-ui.json（由仓库根目录 build-data.js 生成；
         组件样例为仓库自带的 data/components/*.html，
         与 dist 产物同源，不抓取任何网页）
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/hts-ui.json'), 'utf8'));

const SERVER_INFO = { name: 'hts-ui-mcp', version: '2.5.0' };
const PROTOCOL = '2024-11-05';

/* ---------- 工具实现 ---------- */
function findComponent(q) {
    const k = String(q || '').trim().toLowerCase();
    if (!k) return null;
    return DATA.components.find(c => c.id === k || c.name === k ||
        c.id.toLowerCase() === k || c.name.toLowerCase().includes(k.replace(/^./, ch => ch)) ||
        c.id.includes(k)) || null;
}

function componentText(c) {
    const parts = [
        '# ' + c.name + '（' + c.id + '）',
        c.desc ? '说明：' + c.desc : '',
        '',
        '## HTML 结构',
        ...c.boxes.map(b => '```' + b.lang.toLowerCase() + '\n' + b.code + '\n```')
    ];
    const css = DATA.css.filter(g => c.cssTitles.includes(g.title));
    if (css.length) parts.push('## CSS（dist/hts-ui.css 原文）', '```css\n' + css.map(g => '/* ' + g.title + ' */\n' + g.css).join('\n\n') + '\n```');
    return parts.filter(s => s !== null).join('\n');
}

const TOOLS = {
    htsui_overview: {
        description: 'HTS UI 组件库总览：定位、文件结构、28 个组件清单、引入方式与 API。生成任何页面前先调用本工具。',
        input: {},
        run() {
            return [
                DATA.name + ' ' + DATA.version + ' · ' + DATA.tagline,
                DATA.author,
                '组件数：' + DATA.stats.components + ' · CSS 体积：' + DATA.stats.cssBytes + 'B · JS 体积：' + DATA.stats.jsBytes + 'B',
                '',
                '引入方式与 API：',
                DATA.files.usage,
                '',
                '全部组件（用 htsui_get_component 按 id 取完整源码）：',
                DATA.components.map(c => '- ' + c.id + '：' + c.name).join('\n')
            ].join('\n');
        }
    },
    htsui_list_components: {
        description: '列出全部组件的 id、名称、说明。',
        input: {},
        run() {
            return DATA.components.map(c => c.id + ' | ' + c.name + ' | ' + c.desc).join('\n');
        }
    },
    htsui_get_component: {
        description: '获取单个组件完整源码：HTML 结构、CSS 规则（dist 原文）、交互 JS。参数 name 支持 id 或中文名，如 tabs / 标签页。',
        input: { name: { type: 'string', description: '组件 id 或中文名称' } },
        run(a) {
            const c = findComponent(a.name);
            return c ? componentText(c) : '未找到组件「' + a.name + '」。可用：' + DATA.components.map(x => x.id).join(', ');
        }
    },
    htsui_search_components: {
        description: '按关键词搜索组件：匹配 id、中文名、说明、CSS 分组与源码内容，按相关度排序返回。参数 keyword 中英文均可，如 "标签" / "tab" / "弹窗" / "modal"。',
        input: {
            keyword: { type: 'string', description: '搜索关键词（中/英文均可）' },
            limit: { type: 'number', description: '返回条数上限，默认 10' }
        },
        run(a) {
            const raw = String(a.keyword || '').trim();
            const q = raw.toLowerCase();
            if (!q) return '请提供搜索关键词 keyword';
            const limit = Math.max(1, Math.min(DATA.components.length, parseInt(a.limit, 10) || 10));
            const hits = [];
            for (const c of DATA.components) {
                let score = 0;
                const where = [];
                const idL = c.id.toLowerCase();
                const nameL = c.name.toLowerCase();
                if (idL === q) { score += 100; where.push('id 精确'); }
                else if (idL.indexOf(q) === 0) { score += 60; where.push('id 前缀'); }
                else if (idL.includes(q)) { score += 40; where.push('id'); }
                if (nameL === q) { score += 90; where.push('名称精确'); }
                else if (nameL.includes(q)) { score += 50; where.push('名称'); }
                if (c.desc && c.desc.toLowerCase().includes(q)) { score += 20; where.push('说明'); }
                if (c.cssTitles.some(t => t.toLowerCase().includes(q))) { score += 15; where.push('CSS 分组'); }
                if (c.boxes.some(b => b.code.toLowerCase().includes(q))) { score += 10; where.push('源码'); }
                if (score > 0) hits.push({ c, score, where });
            }
            hits.sort((x, y) => y.score - x.score);
            if (!hits.length) return '未找到与「' + raw + '」相关的组件。可用 id：' + DATA.components.map(x => x.id).join(', ');
            const top = hits.slice(0, limit);
            return [
                '搜索「' + raw + '」命中 ' + hits.length + ' 个组件（前 ' + top.length + ' 个，按相关度排序）：',
                '',
                top.map(h => '- ' + h.c.id + ' | ' + h.c.name + ' | 相关度 ' + h.score + ' | 命中：' + h.where.join('、') + (h.c.desc ? '\n  ' + h.c.desc : '')).join('\n'),
                '',
                '用 htsui_get_component 按 id 取完整源码。'
            ].join('\n');
        }
    },
    htsui_get_page_template: {
        description: '获取一套完整页面骨架（桌面/平板/手机全响应式）：head 模板 + 顶部导航 + 主体 + 页脚 + 弹窗/Toast，全部为库内真实类名。',
        input: {},
        run() {
            const nav = DATA.components.find(c => c.id === 'topnav');
            const foot = DATA.components.find(c => c.id === 'tags'); // 页脚在 v1.0 归并展示，给出通用骨架
            return [
                '<!DOCTYPE html>',
                '<html lang="zh-CN">',
                '<head>',
                '    <meta charset="UTF-8">',
                '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                '    <title>页面标题 - HTS UI</title>',
                '    <link rel="stylesheet" href="dist/hts-ui.css">',
                '    <script>',
                "    /* 防闪烁：在渲染前应用主题 */",
                '    ' + DATA.theme.flashSnippet,
                '    </script>',
                '</head>',
                '<body>',
                '    <header class="header"><div class="container header-inner">',
                '        <div class="logo"><img src="logo.png" alt="站点" class="nav-logo logo-light"><img src="logo-dark.png" alt="站点" class="nav-logo logo-dark"></div>',
                '        <nav class="nav"><a href="#home" class="active">首页</a><a href="#about">关于</a>',
                '            <select class="theme-select" aria-label="主题"><option value="system">系统默认</option><option value="light">浅色模式</option><option value="dark">深色模式</option></select>',
                '        </nav>',
                '    </div></header>',
                '',
                '    <main>',
                '        <section class="hero"><div class="container"><h1 class="hero-title">标题</h1><p class="hero-sub">副标题</p></div></section>',
                '        <section id="about" class="section"><div class="container"><h2 class="section-title">区块</h2><p class="section-text">内容</p></div></section>',
                '    </main>',
                '',
                '    <footer class="footer"><div class="container">',
                '        <p>© 2026 站点名</p>',
                '        <p class="footer-site">example.com</p>',
                '    </div></footer>',
                '',
                '    <!-- 弹窗（声明式：按钮 data-hts-modal="myModal" 即可打开） -->',
                '    <div class="modal-mask" id="myModal"><div class="modal-box">',
                '        <button class="modal-close">×</button><p class="modal-title">标题</p><p>内容</p>',
                '        <div style="margin-top:20px"><button class="btn">确 定</button></div>',
                '    </div></div>',
                '',
                '    <script src="dist/hts-ui.js"></script> <!-- 自动应用主题并 HTSUI.init() -->',
                '</body>',
                '</html>'
            ].join('\n');
        }
    },
    htsui_theme: {
        description: '主题系统完整源码：:root 与深色变量、data-theme 规则、HTSTheme API、防闪烁内联脚本、theme-anim-off 防卡顿机制。',
        input: {},
        run() {
            return [
                '主题三态：light / dark / system（localStorage 键 hts-theme；system 时移除 data-theme 跟随 prefers-color-scheme）',
                'API：HTSTheme.getMode() / setMode(mode) / apply()；setMode 后派发 document 事件 hts-theme-change',
                '防闪烁：<head> 内联执行以下脚本——',
                DATA.theme.flashSnippet,
                '防卡顿：apply 前给 html 加 theme-anim-off（全页 transition 禁用 !important），双 rAF 后移除',
                '',
                '## :root 变量（浅色基准）',
                '```css\n' + DATA.theme.vars + '\n```',
                '',
                '## 深色模式规则（dist 原文）',
                '```css\n' + DATA.theme.dark + '\n```',
                '',
                '## HTSTheme 行为源码（dist/hts-ui.js 原文）',
                '```js\n' + (DATA.js.find(b => b.title.includes('主题')) || { code: '' }).code + '\n```'
            ].join('\n');
        }
    },
    htsui_responsive: {
        description: '响应式适配全量规则（桌面/平板/手机）：800px 侧栏抽屉、900px 导航、640px 单列、400px/360px 极限窄屏，dist 原文。',
        input: {},
        run() {
            return ['断点速览：' + DATA.stats.breakpoints.join(' · '), '',
                ...DATA.responsive.map(g => '/* ' + g.title + ' */\n```css\n' + g.css + '\n```')].join('\n\n');
        }
    },
    htsui_animations: {
        description: '动效与无障碍规范：过渡时长基准、弹窗/Toast/进度条动效、prefers-reduced-motion 减少动效规则、主题切换防卡顿机制。',
        input: {},
        run() {
            return [
                '动效基准：' + DATA.animations.motionSpec,
                '主题切换防卡顿：' + DATA.theme.animOff,
                '',
                '## 减少动效（无障碍，dist 原文）',
                '```css\n' + DATA.animations.reducedMotion + '\n```',
                '',
                '## 交互行为源码索引（htsui_get_component 可取对应组件）',
                DATA.js.map(b => '- ' + b.title).join('\n')
            ].join('\n');
        }
    },
    htsui_get_file: {
        description: '获取组件库完整文件原文。file 取 css | js。',
        input: { file: { type: 'string', description: 'css 或 js' } },
        run(a) {
            const k = String(a.file || '').toLowerCase();
            if (k === 'css') return DATA.files.css;
            if (k === 'js') return DATA.files.js;
            return 'file 仅支持 css 或 js';
        }
    }
};

/* ---------- JSON 序列化：中文直出，规避双重转义 ---------- */
function jsonSafe(text) {
    return String(text);
}

/* ---------- MCP stdio 协议（换行分隔 JSON-RPC 2.0） ---------- */
function send(msg) {
    process.stdout.write(JSON.stringify(msg) + '\n');
}
function reply(id, result) { send({ jsonrpc: '2.0', id: id, result: result }); }
function replyErr(id, code, message) { send({ jsonrpc: '2.0', id: id, error: { code: code, message: message } }); }

function handle(req) {
    const p = req.method;
    if (p === 'initialize') {
        reply(req.id, {
            protocolVersion: PROTOCOL,
            capabilities: { tools: {} },
            serverInfo: SERVER_INFO
        });
    } else if (p === 'notifications/initialized' || p === 'initialized') {
        /* 通知无需应答 */
    } else if (p === 'ping') {
        reply(req.id, {});
    } else if (p === 'tools/list') {
        reply(req.id, {
            tools: Object.keys(TOOLS).map(name => ({
                name: name,
                description: TOOLS[name].description,
                inputSchema: { type: 'object', properties: TOOLS[name].input, additionalProperties: false }
            }))
        });
    } else if (p === 'tools/call') {
        const t = TOOLS[req.params && req.params.name];
        if (!t) { replyErr(req.id, -32601, '未知工具'); return; }
        let text;
        try { text = t.run(req.params.arguments || {}); }
        catch (e) { text = '工具执行失败：' + e.message; }
        reply(req.id, { content: [{ type: 'text', text: jsonSafe(text) }], isError: false });
    } else if (p === 'shutdown') {
        reply(req.id, null);
    } else if (typeof p === 'string' && p.startsWith('notifications/')) {
        /* 其他通知忽略 */
    } else {
        if (req.id !== undefined) replyErr(req.id, -32601, 'Method not found: ' + p);
    }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch (e) { continue; }
        if (Array.isArray(msg)) msg.forEach(handle); else handle(msg);
    }
});
process.stdin.on('end', () => process.exit(0));
