// Servidor local que responde como o web app do Apps Script (mesmo Code.gs), para testar o app no navegador
// sem depender da implantação no Google. Uso: node tests/support/mock-apps-script-server.mjs [porta]
import fs from 'node:fs';
import http from 'node:http';
import { createAppsScriptHarness } from './apps-script-harness.mjs';

const port = Number(process.argv[2] || process.env.PORT || 8787);
const stateFile = process.env.MOCK_STATE || '';
const harness = createAppsScriptHarness();

function restoreState() {
  if (!stateFile || !fs.existsSync(stateFile)) return;
  const tabs = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  for (const [name, rows] of Object.entries(tabs)) {
    const sheet = harness.spreadsheet.insertSheet(name);
    const width = Math.max(1, ...rows.map((row) => row.length));
    if (!rows.length) continue;
    const range = sheet.getRange(1, 1, rows.length, width);
    range.setNumberFormat('@');
    range.setValues(rows.map((row) => [...row, ...Array(width - row.length).fill('')]));
  }
}

function persistState() {
  if (stateFile) fs.writeFileSync(stateFile, JSON.stringify(dumpSpreadsheet()));
}

restoreState();

function dumpSpreadsheet() {
  const tabs = {};
  for (const [name, sheet] of harness.spreadsheet.sheets) {
    const rows = [];
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    for (let r = 1; r <= lastRow; r++) {
      rows.push(sheet.getRange(r, 1, 1, lastCol).getValues()[0]);
    }
    tabs[name] = rows;
  }
  return tabs;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (url.pathname === '/dump') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(dumpSpreadsheet()));
    return;
  }

  if (url.pathname !== '/exec') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
    return;
  }

  let payload;
  if (req.method === 'GET') {
    payload = harness.get(Object.fromEntries(url.searchParams));
  } else if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    payload = JSON.parse(harness.context.doPost({ postData: { contents: body } }).getContent());
    if (payload.ok) persistState();
  } else {
    res.writeHead(405);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`MOCK_APPS_SCRIPT_READY http://127.0.0.1:${port}/exec`);
});
