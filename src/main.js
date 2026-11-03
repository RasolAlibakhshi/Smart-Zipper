const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

let currentRoot = null;

function createWindow() {
  const w = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: '#14151c', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, spellcheck: false }
  });
  w.removeMenu();
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  w.webContents.on('will-navigate', ev => ev.preventDefault());
  w.loadFile(path.join(__dirname, 'index.html'));
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(createWindow);
}
app.on('window-all-closed', () => app.quit());

ipcMain.handle('pick-dir', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('scan', async (e, root) => {
  currentRoot = root;
  const out = [];
  let lastTick = 0, bytes = 0;
  const tick = (force) => {
    const now = Date.now();
    if (force || now - lastTick > 80) { lastTick = now; e.sender.send('scan-progress', { files: out.length, bytes }); }
  };
  async function walk(dir) {
    let ents;
    try { ents = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
    const subdirs = [];
    await Promise.all(ents.map(async ent => {
      if (ent.isDirectory()) { subdirs.push(ent.name); return; }
      if (!ent.isFile()) return;
      const full = path.join(dir, ent.name);
      try {
        const st = await fs.promises.stat(full);
        out.push({ rel: path.relative(root, full).split(path.sep).join('/'), size: st.size, mtime: st.mtimeMs });
        bytes += st.size; tick(false);
      } catch {}
    }));
    for (const d of subdirs) await walk(path.join(dir, d));
  }
  await walk(root);
  tick(true);
  let gitignore = '';
  try { gitignore = await fs.promises.readFile(path.join(root, '.gitignore'), 'utf8'); } catch {}
  return { files: out, gitignore };
});

function safe(rel) {
  const full = path.resolve(currentRoot, rel);
  const rt = path.resolve(currentRoot || '');
  if (!currentRoot || (full !== rt && !full.startsWith(rt + path.sep))) throw new Error('bad path');
  return full;
}

ipcMain.handle('read-file', async (_, rel) => {
  const fh = await fs.promises.open(safe(rel), 'r');
  try {
    const buf = Buffer.alloc(60000);
    const { bytesRead } = await fh.read(buf, 0, 60000, 0);
    const b = buf.subarray(0, bytesRead);
    if (b.includes(0)) return { binary: true };
    return { text: b.toString('utf8') };
  } finally { await fh.close(); }
});

ipcMain.handle('reveal', (_, p) => shell.showItemInFolder(p));

ipcMain.handle('export', async (e, { root, files, level, format, structure, structTitle }) => {
  const base = path.basename(root);
  const isMd = format === 'md';
  const r = await dialog.showSaveDialog({
    defaultPath: path.join(path.dirname(root), base + (isMd ? '.md' : '.zip')),
    filters: [isMd ? { name: 'Markdown', extensions: ['md'] } : { name: 'ZIP', extensions: ['zip'] }]
  });
  if (r.canceled) return { canceled: true };
  const send = (done) => e.sender.send('progress', { done, total: files.length });

  if (isMd) {
    const ws = fs.createWriteStream(r.filePath);
    ws.write(`# ${base}\n\n`);
    if (structure) ws.write(`## ${structTitle || 'Project structure'}\n\n\`\`\`\n` + structure + '\n```\n\n');
    let i = 0, skipped = 0;
    for (const f of files) {
      send(++i);
      let txt;
      try { txt = await fs.promises.readFile(path.join(root, f), 'utf8'); } catch { skipped++; continue; }
      if (txt.includes('\0')) { skipped++; continue; }
      const runs = txt.match(/`+/g) || [];
      const fence = '`'.repeat(Math.max(3, ...runs.map(s => s.length + 1)));
      const lang = path.extname(f).slice(1);
      ws.write(`## ${f}\n\n${fence}${lang}\n${txt}\n${fence}\n\n`);
    }
    await new Promise(res => ws.end(res));
    return { path: r.filePath, bytes: fs.statSync(r.filePath).size, skipped };
  }

  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(r.filePath);
    const ar = archiver('zip', { zlib: { level: level ?? 6 } });
    let i = 0;
    out.on('close', () => resolve({ path: r.filePath, bytes: ar.pointer() }));
    ar.on('error', err => reject(err.message));
    ar.on('entry', () => send(++i));
    ar.pipe(out);
    if (structure) ar.append(structure, { name: 'STRUCTURE.txt' });
    for (const f of files) ar.file(path.join(root, f), { name: f });
    ar.finalize();
  });
});
