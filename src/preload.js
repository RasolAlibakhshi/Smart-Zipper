const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('api', {
  pickDir: () => ipcRenderer.invoke('pick-dir'),
  scan: r => ipcRenderer.invoke('scan', r),
  readFile: r => ipcRenderer.invoke('read-file', r),
  reveal: p => ipcRenderer.invoke('reveal', p),
  exportFiles: o => ipcRenderer.invoke('export', o),
  getPath: f => webUtils.getPathForFile(f),
  onProgress: cb => ipcRenderer.on('progress', (_, p) => cb(p)),
  onScanProgress: cb => ipcRenderer.on('scan-progress', (_, p) => cb(p))
});
