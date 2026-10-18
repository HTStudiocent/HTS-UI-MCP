/* ============================================================
   HTS UI MCP 2.5 · 数据构建脚本（零依赖）
   在仓库根目录执行：node build-data.js
   从 dist/hts-ui.css、dist/hts-ui.js 与仓库自带组件样例
   data/components/*.html 提取全部组件的 HTML/CSS/JS 源码
   与响应式规则，生成 data/hts-ui.json
   （组件样例以 data/components/ 为准维护，不依赖任何网页）
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;                                  // 仓库根
const OUT = path.join(__dirname, 'data');

/* ---------- 1. 读取组件库产物 ---------- */
const cssText = fs.readFileSync(path.join(ROOT, 'dist/hts-ui.css'), 'utf8');
const jsText = fs.readFileSync(path.join(ROOT, 'dist/hts-ui.js'), 'utf8');

/* ---------- 2. 从仓库自带样例提取组件演示（HTML/JS/CSS 代码框） ---------- */
/* 组件展示顺序（基础 → 进阶），新增组件时同步维护并补充对应 .html 文件 */
const ORDER = ['colors', 'typo', 'buttons', 'forms', 'cards', 'tags', 'table',
    'overlay', 'motion', 'codebox', 'theme', 'topnav', 'sidenav',
    'breadcrumb', 'pagination', 'tabs', 'accordion', 'steps', 'timeline',
    'avatar', 'skeleton', 'alert', 'empty', 'spinner', 'tooltip',
    'dropdown', 'segmented', 'listgroup'];
const COMPONENTS_DIR = path.join(OUT, 'components');

function decodeEntities(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

const components = [];
for (const id of ORDER) {
    const file = path.join(COMPONENTS_DIR, id + '.html');
    if (!fs.existsSync(file)) { console.error('缺少组件样例文件：' + file); process.exit(1); }
    const seg = fs.readFileSync(file, 'utf8');
    const nameM = seg.match(/<h2>([^<]+)<\/h2>/);
    const descM = seg.match(/<p class="ui-desc">([\s\S]*?)<\/p>/);
    const desc = descM ? descM[1].replace(/<[^>]+>/g, '').trim() : '';
    const boxes = [];
    const boxRe = /<div class="code-box">\s*<div class="code-box-head"><span class="code-box-lang">([^<]+)<\/span>[\s\S]*?<pre><code>([\s\S]*?)<\/code><\/pre>/g;
    let b;
    while ((b = boxRe.exec(seg)) !== null) {
        boxes.push({ lang: b[1], code: decodeEntities(b[2]).replace(/\r\n/g, '\n').trim() });
    }
    components.push({ id, name: nameM ? nameM[1] : id, desc, boxes });
}

/* ---------- 3. CSS 按注释分组（大段 / 小节 / @media / @keyframes） ---------- */
const cssGroups = [];
{
    const lines = cssText.split(/\r?\n/);
    let cur = { title: '文件头 · 主题变量（:root）', rules: [] };
    let depth = 0;
    for (const line of lines) {
        const t = line.trim();
        const big = t.match(/^\/\* -{3,} (?:\d+\.)? ?(.+?) -{3,} \*\/$/);
        const sub = t.match(/^\/\* (\d+\.\d+) (.+?) \*\/$/);
        const plain = t.match(/^\/\* (.+) \*\/$/);
        if (depth === 0 && (big || sub || plain) && !/^\s/.test(line)) {
            if (cur.rules.length || cur.title) cssGroups.push(cur);
            cur = { title: sub ? sub[1] + ' ' + sub[2] : (big ? big[1] : plain[1]), rules: [] };
            continue;
        }
        cur.rules.push(line);
        for (const ch of t) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
        }
        if (depth < 0) depth = 0;
    }
    if (cur.rules.join('').trim()) cssGroups.push(cur);
}
// 去掉无内容的组，规整字段；连续无前导注释的规则并入上一组
const css = cssGroups
    .filter(g => g.rules.join('').trim())
    .map(g => ({ title: g.title || '(续) ' + (cssGroups.length ? '' : ''), css: g.rules.join('\n').replace(/\r/g, '').trim() }));

/* ---------- 4. JS 按注释分组 ---------- */
const js = [];
{
    const parts = jsText.split(/\/\* -{4,} (.+?) -{4,} \*\//);
    // parts: [头, 标题1, 代码1, 标题2, 代码2...]
    for (let i = 1; i < parts.length; i += 2) {
        const code = parts[i + 1] ? parts[i + 1].trim() : '';
        if (code) js.push({ title: parts[i].trim(), code });
    }
}

/* ---------- 5. 组件 → CSS 规则组匹配（按演示中出现的特征 class / data- 属性） ---------- */
const GENERIC = new Set(['active', 'open', 'on', 'off', 'done', 'sm', 'lg', 'square', 'strong',
    'container', 'header-inner', 'hero', 'section', 'footer']);
function keywordsFrom(boxes) {
    const html = boxes.map(b => b.code).join('\n');
    const set = new Set();
    let mm;
    const clsRe = /class="([^"]+)"/g;
    while ((mm = clsRe.exec(html)) !== null) mm[1].split(/\s+/).forEach(c => {
        if (c && !GENERIC.has(c) && !/^logo-/.test(c)) set.add('.' + c);
    });
    const attrRe = /\[?(data-[a-z-]+)/g;
    while ((mm = attrRe.exec(html)) !== null) set.add(mm[1]);
    return Array.from(set);
}
for (const c of components) {
    const kws = keywordsFrom(c.boxes);
    c.cssTitles = css.filter(g => kws.some(k => g.css.includes(k))).map(g => g.title);
}

/* ---------- 6. 响应式与主题、动效专项数据 ---------- */
const responsive = css.filter(g => /@media/.test(g.css) && !g.css.includes('prefers-reduced-motion'));
const themeVars = css.find(g => g.css.includes(':root')) || { title: '主题变量', css: '' };
const themeDark = css.filter(g => /data-theme=.dark|prefers-color-scheme/.test(g.css));
const a11y = css.filter(g => g.css.includes('prefers-reduced-motion') || g.title.includes('减少动效'));

const data = {
    name: 'HTS UI',
    version: '2.5.0',
    tagline: '零依赖 · 黑白灰 · 简约扁平 · 浅色/深色/跟随系统 · 桌面/平板/手机响应式',
    author: 'HTStudiocent · MIT License · 展示: https://www.haotis.top/ui/',
    stats: {
        components: components.length,
        cssBytes: cssText.length,
        jsBytes: jsText.length,
        breakpoints: ['800px 侧栏抽屉', '900px 导航收缩', '640px 栅格单列', '400px 字体缩小', '360px 极限窄屏']
    },
    theme: {
        vars: themeVars.css,
        dark: themeDark.map(g => g.css).join('\n\n'),
        flashSnippet: '(function(){try{var m=localStorage.getItem(\'hts-theme\')||\'system\';var h=document.documentElement;if(m===\'light\'||m===\'dark\')h.setAttribute(\'data-theme\',m);else h.removeAttribute(\'data-theme\');}catch(e){}})();',
        animOff: 'html.theme-anim-off * { transition: none !important; }（切换主题瞬间禁用过渡，双 rAF 后恢复，见 JS「主题」模块 applyTheme）'
    },
    animations: {
        motionSpec: '悬停 0.25s · 按压 0.15s · 渐显 0.6s · 弹窗遮罩淡入+卡片缩放 · Toast 0.3s',
        reducedMotion: a11y.map(g => g.css).join('\n\n')
    },
    responsive: responsive,
    components: components,
    css: css,
    js: js,
    files: {
        css: cssText,
        js: jsText,
        usage: [
            '1. 复制 dist/hts-ui.css 与 dist/hts-ui.js 到项目',
            '2. <link rel="stylesheet" href="dist/hts-ui.css">',
            '3. <script src="dist/hts-ui.js"></script>（自动应用主题并默认调用 HTSUI.init()）',
            '4. 需要手动初始化时：HTSUI.init(root)，root 缺省为 document',
            '5. API：HTSTheme.getMode()/setMode(mode)/apply()；HTSUI.toast(msg)、HTSUI.openModal(id)、HTSUI.closeModal(id)',
            '6. 声明式绑定：data-hts-modal="弹窗id" 打开弹窗；.theme-select 自动接管主题下拉',
            '7. 防闪烁：在 <head> 内联执行 theme.flashSnippet（读 localStorage hts-theme 提前设置 data-theme）'
        ].join('\n')
    }
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'hts-ui.json'), JSON.stringify(data));
console.log('OK components:', components.length, '| css groups:', css.length,
    '| js blocks:', js.length, '| responsive:', responsive.length,
    '| json bytes:', fs.statSync(path.join(OUT, 'hts-ui.json')).size);
