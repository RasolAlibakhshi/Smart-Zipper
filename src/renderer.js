const $ = id => document.getElementById(id);
const CODE_EXTS = new Set('js,jsx,mjs,cjs,ts,tsx,vue,svelte,py,rb,php,java,kt,kts,scala,go,rs,c,h,cc,cpp,hpp,cs,swift,m,mm,dart,lua,r,pl,sh,bash,zsh,ps1,bat,sql,graphql,gql,html,htm,css,scss,sass,less,json,yaml,yml,toml,ini,xml,md,mdx,proto,gradle,tf,ex,exs,erl,hs,clj,sol'.split(','));
const CODE_NAMES = new Set(['dockerfile','makefile','cmakelists.txt','gemfile','rakefile','procfile','.gitignore','.dockerignore','.eslintrc','.prettierrc','.babelrc','.editorconfig']);
const TEXT_EXTS = new Set([...CODE_EXTS, 'txt','csv','svg','log','env','lock','cfg','conf','rst','tex']);
const IGNORE_DIRS = new Set(['node_modules','.git','dist','build','out','.next','.nuxt','.cache','coverage','venv','.venv','env','__pycache__','.idea','.vscode','target','vendor','.gradle','.dart_tool','bin','obj','.turbo','.parcel-cache','.pytest_cache']);
const LOCKS = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock|Gemfile\.lock|poetry\.lock|Cargo\.lock|go\.sum|.*\.min\.(js|css)|.*\.map)$/i;
const SECRET = /(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx)|id_rsa.*|credentials\.json|secrets?\.(json|ya?ml))$/i;
const TESTS = /(^|\/)(tests?|__tests__|spec|e2e)\/|\.(test|spec)\.[a-z]+$/i;
const MODELS = [['GPT-4o',128e3],['Claude',200e3],['Gemini',1e6],['Llama 3',128e3],['DeepSeek',64e3]];
const MB = 1024 * 1024, GB = 1024 * MB;

const T = {
  fa: {
    appTitle: 'زیپ هوشمند کد', tagline: 'کد اصلی پروژه را جدا کن و برای هوش مصنوعی بفرست',
    dropMain: 'پوشه پروژه را اینجا رها کنید', dropSub: 'یا برای انتخاب کلیک کنید', recentTitle: 'پروژه‌های اخیر',
    back: '→ تغییر پوشه', preset: 'پریست:', pCode: '⭐ فقط کد اصلی', pAll: 'همه فایل‌ها',
    noTests: 'بدون فایل‌های تست', useGit: 'احترام به .gitignore', skipBigPre: 'حذف فایل‌های بزرگ‌تر از', mb: 'MB',
    advanced: '⚙ پیشرفته', pat: 'الگوهای ایگنور (با کاما یا خط جدید)', extF: 'پسوندهای مجاز',
    sizeF: 'حجم از / تا (MB)', dateF: 'تاریخ تغییر از / تا',
    search: '🔍 جستجوی فایل یا پوشه...', expandAll: 'باز کردن همه', collapseAll: 'بستن همه',
    reset: 'بازنشانی به پریست', none: 'هیچ‌کدام', preview: 'پیش‌نمایش', pvHint: 'روی یک فایل کلیک کنید',
    ignoredHdr: 'موارد ایگنور شده', ignNone: 'چیزی ایگنور نشده', ignMore: 'و موارد بیشتر...',
    addStruct: 'افزودن ساختار درختی', mdBtn: '📝 خروجی Markdown', zipBtn: '📦 ساخت ZIP',
    scanning: 'در حال اسکن...', nothing: 'چیزی پیدا نشد', binary: '(فایل باینری، قابل نمایش نیست)',
    noSel: 'هیچ فایلی انتخاب نشده است', done: '✅ ساخته شد', showFolder: 'نمایش در پوشه', err: '❌ خطا: ',
    secretWarn: n => `🔒 ${n} فایل حساس (مثل .env) انتخاب شده است!`,
    bigWarn: (n, s) => `⚠ ${n} فایل بزرگ‌تر از ${s} MB انتخاب شده است.`,
    stat: (a, b, s, t) => `${a} از ${b} فایل · ${s} · ≈ ${t} توکن`,
    folderFiles: (a, b) => `${a}/${b} فایل · `, ignoredN: n => `${n} ایگنور`,
    secBadge: '🔒 حساس', bigBadge: '⚠ بزرگ', ignBadge: '⛔ ',
    structTitle: 'ساختار پروژه', tokHint: 'تخمین تقریبی (~3.6 بایت = 1 توکن)',
    reasons: { manual: 'به‌صورت دستی ایگنور شد', secret: 'فایل حساس', preset: 'خارج از پریست کد', test: 'فایل تست',
      git: 'الگوی .gitignore', big: 'فایل بزرگ', pattern: 'الگوی ایگنور', ext: 'پسوند مجاز نیست',
      size: 'خارج از بازه حجم', date: 'خارج از بازه تاریخ' },
    lang: 'English', dir: 'rtl'
  },
  en: {
    appTitle: 'Smart Zipper', tagline: 'Extract your project’s core code and send it to an AI',
    dropMain: 'Drop your project folder here', dropSub: 'or click to choose', recentTitle: 'Recent projects',
    back: '← Change folder', preset: 'Preset:', pCode: '⭐ Core code only', pAll: 'All files',
    noTests: 'Exclude tests', useGit: 'Respect .gitignore', skipBigPre: 'Skip files larger than', mb: 'MB',
    advanced: '⚙ Advanced', pat: 'Ignore patterns (comma or newline)', extF: 'Allowed extensions',
    sizeF: 'Size from / to (MB)', dateF: 'Modified from / to',
    search: '🔍 Search files or folders...', expandAll: 'Expand all', collapseAll: 'Collapse all',
    reset: 'Reset to preset', none: 'None', preview: 'Preview', pvHint: 'Click a file to preview it',
    ignoredHdr: 'Ignored items', ignNone: 'Nothing is ignored', ignMore: '...and more',
    addStruct: 'Add directory tree', mdBtn: '📝 Markdown export', zipBtn: '📦 Build ZIP',
    scanning: 'Scanning...', nothing: 'Nothing found', binary: '(binary file, cannot preview)',
    noSel: 'No files selected', done: '✅ Created', showFolder: 'Show in folder', err: '❌ Error: ',
    secretWarn: n => `🔒 ${n} sensitive file(s) (like .env) are selected!`,
    bigWarn: (n, s) => `⚠ ${n} file(s) larger than ${s} MB are selected.`,
    stat: (a, b, s, t) => `${a} of ${b} files · ${s} · ≈ ${t} tokens`,
    folderFiles: (a, b) => `${a}/${b} files · `, ignoredN: n => `${n} ignored`,
    secBadge: '🔒 secret', bigBadge: '⚠ large', ignBadge: '⛔ ',
    structTitle: 'Project structure', tokHint: 'Rough estimate (~3.6 bytes = 1 token)',
    reasons: { manual: 'Ignored manually', secret: 'Sensitive file', preset: 'Outside core-code preset', test: 'Test file',
      git: '.gitignore rule', big: 'File too large', pattern: 'Ignore pattern', ext: 'Extension not allowed',
      size: 'Outside size range', date: 'Outside date range' },
    lang: 'فارسی', dir: 'ltr'
  }
};
let lang = localStorage.lang || 'en';
const t = () => T[lang];

let root = null, files = [], tree = null, preset = 'code', gitRules = [];
let ov = new Map(), expanded = new Set(['']);

// Always MB, switch to GB only when very large. Western digits.
const fmt = b => (b >= GB ? (b / GB).toFixed(2) + ' GB' : (b / MB).toFixed(2) + ' MB');
const num = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const extOf = n => n.includes('.') ? n.split('.').pop().toLowerCase() : '';
const isText = f => TEXT_EXTS.has(f.ext) || CODE_NAMES.has(f.name.toLowerCase());
const tokens = f => isText(f) ? f.size / 3.6 : 0;
const bigMB = () => +$('bigMB').value || 1;

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = t().dir;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t()[el.dataset.i18n]);
  $('q').placeholder = t().search;
  document.querySelectorAll('.langBtn').forEach(b => b.textContent = t().lang);
  document.title = t().appTitle;
  $('stat').title = t().tokHint;
  if (!$('pvTitle').dataset.file) $('pvTitle').textContent = t().preview;
  if (!$('pv').dataset.file) $('pv').textContent = t().pvHint;
}
document.querySelectorAll('.langBtn').forEach(b => b.onclick = () => { lang = lang === 'fa' ? 'en' : 'fa'; localStorage.lang = lang; applyLang(); if (root) { render(); } showRecent(); });

function toast(html, ms = 9000) {
  const el = $('toast'); el.innerHTML = html; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, ms);
  return el;
}

function globRx(p) {
  p = p.trim(); if (!p || p.startsWith('#') || p.startsWith('!')) return null;
  if (p.endsWith('/')) p = p.slice(0, -1);
  const anchored = p.startsWith('/') || p.includes('/');
  p = p.replace(/^\//, '');
  const body = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0000/g, '.*');
  return new RegExp((anchored ? '^' : '(^|/)') + body + '(/|$)', 'i');
}
const parseRules = txt => txt.split(/[,\n]/).map(globRx).filter(Boolean);

function buildTree() {
  tree = { name: '', path: '', dir: true, kids: new Map() };
  for (const f of files) {
    const parts = f.rel.split('/'); let n = tree, p = '';
    for (let i = 0; i < parts.length - 1; i++) {
      p = p ? p + '/' + parts[i] : parts[i];
      if (!n.kids.has(parts[i])) n.kids.set(parts[i], { name: parts[i], path: p, dir: true, kids: new Map() });
      n = n.kids.get(parts[i]);
    }
    n.kids.set(f.name, { name: f.name, path: f.rel, dir: false, f });
  }
}

// returns { inc, why } where why is a reason key when excluded
function ruleWhy(f) {
  const r = f.rel, segs = r.split('/');
  const no = why => ({ inc: false, why });
  if (SECRET.test(r)) return no('secret');
  if (preset === 'code') {
    if (segs.slice(0, -1).some(s => IGNORE_DIRS.has(s))) return no('preset');
    if (!(CODE_EXTS.has(f.ext) || CODE_NAMES.has(f.name.toLowerCase()))) return no('preset');
    if (LOCKS.test(r)) return no('preset');
  }
  if ($('oTests').checked && TESTS.test(r)) return no('test');
  if ($('oGit').checked && gitRules.some(x => x.test(r))) return no('git');
  if ($('oBig').checked && f.size > bigMB() * MB) return no('big');
  if (parseRules($('ig').value).some(x => x.test(r))) return no('pattern');
  const ex = $('ext').value.split(',').map(s => s.trim().replace(/^\./, '').toLowerCase()).filter(Boolean);
  if (ex.length && !ex.includes(f.ext)) return no('ext');
  const mn = $('minS').value, mx = $('maxS').value;
  if (mn !== '' && f.size < mn * MB) return no('size');
  if (mx !== '' && f.size > mx * MB) return no('size');
  if ($('from').value && f.mtime < new Date($('from').value).getTime()) return no('date');
  if ($('to').value && f.mtime > new Date($('to').value).getTime() + 864e5) return no('date');
  return { inc: true, why: null };
}
function evalFile(f) {
  let p = f.rel;
  while (true) {
    if (ov.has(p)) { const v = ov.get(p); return { inc: v, why: v ? null : 'manual' }; }
    if (!p) break;
    const i = p.lastIndexOf('/'); p = i < 0 ? '' : p.slice(0, i);
  }
  return ruleWhy(f);
}

function agg(n, q) {
  if (!n.dir) {
    n.cnt = 1; n.size = n.f.size; n.inc = n.f.inc ? 1 : 0; n.incSize = n.f.inc ? n.f.size : 0;
    n.match = !q || n.path.toLowerCase().includes(q); return;
  }
  n.cnt = n.inc = n.size = n.incSize = 0; n.match = !q || n.path.toLowerCase().includes(q);
  let kidMatch = false;
  for (const k of n.kids.values()) {
    agg(k, q); n.cnt += k.cnt; n.inc += k.inc; n.size += k.size; n.incSize += k.incSize;
    if (k.match) kidMatch = true;
  }
  if (q && kidMatch && !n.path.toLowerCase().includes(q)) n.match = true;
}

function rows(n, depth, out, q) {
  const kids = [...n.kids.values()].sort((a, b) => (b.dir - a.dir) || (b.size - a.size));
  for (const k of kids) {
    if (!k.match) continue;
    const pad = depth * 18, enc = encodeURIComponent(k.path);
    const pct = n.size ? Math.max(1, k.size / n.size * 100) : 0;
    const state = k.inc === 0 ? 'none' : k.inc === k.cnt ? 'all' : 'some';
    const open = k.dir && (q || expanded.has(k.path));
    let badge = '';
    if (!k.dir) {
      if (!k.f.inc) badge = `<span class="warn">${t().ignBadge}${t().reasons[k.f.why]}</span>`;
      else if (k.f.size > bigMB() * MB) badge = `<span class="warn">${t().bigBadge}</span>`;
      if (SECRET.test(k.path)) badge += `<span class="warn">${t().secBadge}</span>`;
    } else if (k.inc < k.cnt) {
      badge = `<span class="warn">${t().ignBadge}${t().ignoredN(num(k.cnt - k.inc))}</span>`;
    }
    out.push(`<div class="row ${state === 'none' ? 'ex' : ''}" style="padding-left:${pad + 6}px" data-p="${enc}" data-d="${k.dir ? 1 : 0}">
      <div class="pbar" style="width:${pct}%"></div>
      <span class="arrow">${k.dir ? (open ? '▾' : '▸') : ''}</span>
      <input type="checkbox" data-st="${state}" ${state === 'all' ? 'checked' : ''}>
      <span class="nm">${k.dir ? '📁' : '📄'} ${esc(k.name)}</span>${badge}
      <span class="sz">${k.dir ? t().folderFiles(num(k.inc), num(k.cnt)) : ''}${fmt(k.dir ? k.incSize : k.size)}</span></div>`);
    if (k.dir && open) rows(k, depth + 1, out, q);
  }
}

function renderIgnored() {
  const ign = files.filter(f => !f.inc).sort((a, b) => b.size - a.size);
  const LIM = 500;
  $('ignList').innerHTML = ign.length ? ign.slice(0, LIM).map(f =>
    `<div class="ignRow"><div class="ltr ign-p">${esc(f.rel)}</div><div class="muted">${t().reasons[f.why]} · ${fmt(f.size)}</div></div>`).join('') +
    (ign.length > LIM ? `<div class="muted">${t().ignMore} (${num(ign.length - LIM)})</div>` : '')
    : `<div class="muted">${t().ignNone}</div>`;
}

function render() {
  files.forEach(f => { const e = evalFile(f); f.inc = e.inc; f.why = e.why; });
  const q = $('q').value.trim().toLowerCase();
  agg(tree, q);
  const out = []; rows(tree, 0, out, q);
  const sc = $('tree').scrollTop;
  $('tree').innerHTML = out.join('') || `<p class="muted" style="padding:20px">${t().nothing}</p>`;
  $('tree').scrollTop = sc;
  $('tree').querySelectorAll('input[data-st=some]').forEach(i => i.indeterminate = true);

  const sel = files.filter(f => f.inc);
  const size = sel.reduce((s, f) => s + f.size, 0);
  const tk = sel.reduce((s, f) => s + tokens(f), 0);
  $('stat').textContent = t().stat(num(sel.length), num(files.length), fmt(size), num(tk));
  $('models').innerHTML = MODELS.map(([n, c]) => {
    const r = tk / c, cls = r > 1 ? 'bad' : r > .6 ? 'mid' : '';
    return `<span class="m ${cls}">${n}: ${(r * 100).toFixed(1)}% of ${num(c / 1000)}k</span>`;
  }).join('');
  const sec = sel.filter(f => SECRET.test(f.rel)), big = sel.filter(f => f.size > bigMB() * MB);
  $('warns').innerHTML =
    (sec.length ? `<div class="wbox">${t().secretWarn(num(sec.length))}</div>` : '') +
    (big.length ? `<div class="wbox">${t().bigWarn(num(big.length), bigMB())}</div>` : '');
  renderIgnored();
}

function structureText() {
  const lines = [(root || '').split(/[\\/]/).pop() + '/'];
  (function walk(n, pre) {
    const kids = [...n.kids.values()].filter(k => k.inc > 0).sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name));
    kids.forEach((k, i) => {
      const last = i === kids.length - 1;
      lines.push(pre + (last ? '└── ' : '├── ') + k.name + (k.dir ? '/' : ''));
      if (k.dir) walk(k, pre + (last ? '    ' : '│   '));
    });
  })(tree, '');
  return lines.join('\n');
}

async function openProject(dir) {
  $('welcome').hidden = true; $('work').hidden = false;
  root = dir; ov.clear(); expanded = new Set(['']); $('q').value = '';
  $('projName').textContent = dir.split(/[\\/]/).pop();
  $('rootPath').textContent = dir;
  $('tree').innerHTML = `<div class="scanCard"><div class="scanTxt">${t().scanning} <span id="scanN" class="ltr">0</span> · <span id="scanB" class="ltr">0.00 MB</span></div><div class="pgwrap indet"><div class="pgfill"></div></div></div>`;
  const r = await api.scan(dir);
  files = r.files.map(f => ({ ...f, name: f.rel.split('/').pop(), ext: extOf(f.rel.split('/').pop()) }));
  gitRules = parseRules(r.gitignore);
  buildTree(); render();
  const rec = [dir, ...JSON.parse(localStorage.recent || '[]').filter(x => x !== dir)].slice(0, 6);
  localStorage.recent = JSON.stringify(rec);
}
function showRecent() {
  const rec = JSON.parse(localStorage.recent || '[]');
  $('recentBox').hidden = !rec.length;
  $('recent').innerHTML = rec.map(r => `<button data-r="${encodeURIComponent(r)}">${esc(r)}</button>`).join('');
}

applyLang();
showRecent();

$('drop').onclick = async () => { const d = await api.pickDir(); if (d) openProject(d); };
$('drop').ondragover = e => { e.preventDefault(); $('drop').classList.add('over'); };
$('drop').ondragleave = () => $('drop').classList.remove('over');
$('drop').ondrop = e => {
  e.preventDefault(); $('drop').classList.remove('over');
  const f = e.dataTransfer.files[0]; if (f) openProject(api.getPath(f));
};
$('recent').onclick = e => { const b = e.target.closest('button'); if (b) openProject(decodeURIComponent(b.dataset.r)); };
$('back').onclick = () => { $('work').hidden = true; $('welcome').hidden = false; showRecent(); };
$('advBtn').onclick = () => { const h = $('adv').hidden = !$('adv').hidden; $('advBtn').classList.toggle('on', !h); };

document.querySelectorAll('.chip').forEach(b => b.onclick = () => {
  preset = b.dataset.preset;
  document.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
  ov.clear(); render();
});
const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };
const refilter = debounce(() => { ov.clear(); render(); }, 150);
['oTests','oGit','oBig','bigMB','ig','ext','minS','maxS','from','to'].forEach(i => $(i).addEventListener('input', refilter));
$('q').addEventListener('input', debounce(render, 120));

$('selAll').onclick = () => { ov.clear(); render(); };
$('selNone').onclick = () => { ov.clear(); ov.set('', false); render(); };
$('expandAll').onclick = () => { (function w(n) { if (n.dir) { expanded.add(n.path); n.kids.forEach(w); } })(tree); render(); };
$('collapseAll').onclick = () => { expanded = new Set(['']); render(); };

$('tree').onclick = async e => {
  const row = e.target.closest('.row'); if (!row) return;
  const p = decodeURIComponent(row.dataset.p), isDir = row.dataset.d === '1';
  if (e.target.matches('input')) {
    const on = e.target.dataset.st !== 'all';
    for (const k of [...ov.keys()]) if (k.startsWith(p + '/') || k === p) ov.delete(k);
    ov.set(p, on); render(); return;
  }
  if (isDir) { expanded.has(p) ? expanded.delete(p) : expanded.add(p); render(); }
  else {
    $('pvTitle').textContent = p; $('pvTitle').dataset.file = 1;
    $('pv').dataset.file = 1;
    $('pv').textContent = '...';
    const r = await api.readFile(p);
    $('pv').textContent = r.binary ? t().binary : r.text;
  }
};

api.onScanProgress(p => { const n = $('scanN'), b = $('scanB'); if (n) { n.textContent = num(p.files); b.textContent = fmt(p.bytes); } });
let pgTimer = null;
api.onProgress(p => {
  const w = $('pg'), pct = p.total ? Math.min(100, p.done / p.total * 100) : 0;
  clearTimeout(pgTimer);
  w.hidden = false;
  w.querySelector('.pgfill').style.width = pct.toFixed(1) + '%';
  w.querySelector('.pgtxt').textContent = `${num(p.done)} / ${num(p.total)} · ${pct.toFixed(0)}%`;
  if (p.done >= p.total) pgTimer = setTimeout(() => { w.hidden = true; }, 1500);
});

async function doExport(format) {
  const list = files.filter(f => f.inc).map(f => f.rel);
  if (!list.length) return toast(t().noSel);
  try {
    const r = await api.exportFiles({ root, files: list, format, level: 6,
      structure: $('oStruct').checked ? structureText() : '', structTitle: t().structTitle });
    if (!r.canceled) {
      const el = toast(`${t().done} (${fmt(r.bytes)}) <button id="rv">${t().showFolder}</button>`);
      $('rv').onclick = () => api.reveal(r.path);
    }
  } catch (e) { toast(t().err + e); }
  $('pg').hidden = true;
}
$('zip').onclick = () => doExport('zip');
$('mdBtn').onclick = () => doExport('md');
