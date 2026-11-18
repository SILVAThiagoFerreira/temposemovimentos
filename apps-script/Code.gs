/**
 * Backend de persistência do Tempos e Movimentos em Google Sheets (Apps Script).
 *
 * Requisições (ver DATA_SCHEMA.md, seção "Planilha"):
 *   GET  ?action=ping      → {ok, schemaVersion}
 *   GET  ?action=version   → {ok, updatedAt}              leitura leve, usada pelo polling
 *   GET  ?action=snapshot  → {ok, snapshot, updatedAt}    snapshot null se a planilha estiver vazia
 *   POST {action:"save", snapshot} → {ok, updatedAt}      grava o snapshot inteiro (substitui as abas)
 *
 * Respostas sempre em JSON. Erros voltam como {ok:false, error}.
 * Leituras e gravações usam o lock do script, para nunca ler um estado pela metade.
 * Gravação recusada quando o snapshot não tem usuários, para não apagar o cadastro.
 * Função criarAbas(): cria as abas e os cabeçalhos a partir do esquema (rodar uma vez).
 */

var LOCK_WAIT_MS = 20000;

function doGet(e) {
  return jsonOutput_(handleRequest_(e && e.parameter ? e.parameter : {}));
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return jsonOutput_({ ok: false, error: 'Corpo JSON inválido' });
  }
  return jsonOutput_(handleRequest_(body));
}

function handleRequest_(params) {
  try {
    var action = String(params.action || '');

    if (action === 'ping') {
      return { ok: true, schemaVersion: SHEETS_SCHEMA.version };
    }

    if (action === 'version') {
      return withLock_(function () {
        return { ok: true, updatedAt: readUpdatedAt_(getSpreadsheet_()) };
      });
    }

    if (action === 'snapshot') {
      return withLock_(function () {
        var snapshot = readSnapshot_(getSpreadsheet_());
        return { ok: true, snapshot: snapshot, updatedAt: snapshot ? snapshot.updatedAt || null : null };
      });
    }

    if (action === 'save') {
      validateSnapshot_(params.snapshot);
      return withLock_(function () {
        writeSnapshot_(getSpreadsheet_(), params.snapshot);
        return { ok: true, updatedAt: params.snapshot.updatedAt || null };
      });
    }

    return { ok: false, error: 'Ação desconhecida: ' + action };
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) };
  }
}

/** Cria as abas e os cabeçalhos do esquema. Pode ser rodada à vontade: não apaga dados. */
function criarAbas() {
  var ss = getSpreadsheet_();
  Object.keys(SHEETS_SCHEMA.collections).forEach(function (tab) {
    ensureHeaders_(ensureSheet_(ss, tab), expectedHeaders_(tab));
  });
  var cols = SHEETS_SCHEMA.settingsColumns;
  ensureHeaders_(ensureSheet_(ss, SHEETS_SCHEMA.settingsTab), [cols.key, cols.value, cols.type]);
}

// ---------------------------------------------------------------- infraestrutura

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function withLock_(task) {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    return task();
  } finally {
    lock.releaseLock();
  }
}

function validateSnapshot_(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('Snapshot ausente ou inválido');
  }
  Object.keys(SHEETS_SCHEMA.collections).forEach(function (tab) {
    var source = SHEETS_SCHEMA.collections[tab].source;
    if (!Array.isArray(snapshot[source])) {
      throw new Error('Coleção ausente no snapshot: ' + source);
    }
  });
  if (snapshot.operators.length === 0) {
    throw new Error('Gravação recusada: snapshot sem usuários');
  }
}

// ---------------------------------------------------------------- leitura

function readSnapshot_(ss) {
  var users = readCollection_(ss, 'usuarios');
  if (!users.length) {
    return null;
  }
  var snapshot = {};
  Object.keys(SHEETS_SCHEMA.collections).forEach(function (tab) {
    snapshot[SHEETS_SCHEMA.collections[tab].source] = tab === 'usuarios' ? users : readCollection_(ss, tab);
  });
  readSettingsRows_(ss).forEach(function (row) {
    setPath_(snapshot, row.key, decodeSetting_(row.type, row.value));
  });
  return snapshot;
}

function readUpdatedAt_(ss) {
  var rows = readSettingsRows_(ss);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].key === 'updatedAt') {
      return rows[i].value || null;
    }
  }
  return null;
}

function readCollection_(ss, tab) {
  var sheet = ss.getSheetByName(tab);
  if (!sheet) {
    return [];
  }
  var table = readTable_(sheet);
  var spec = SHEETS_SCHEMA.collections[tab];
  return table.rows.map(function (row) {
    return decodeItem_(tab, spec, row, table.index);
  });
}

function readSettingsRows_(ss) {
  var sheet = ss.getSheetByName(SHEETS_SCHEMA.settingsTab);
  if (!sheet) {
    return [];
  }
  var table = readTable_(sheet);
  var cols = SHEETS_SCHEMA.settingsColumns;
  var keyIndex = table.index[cols.key];
  var valueIndex = table.index[cols.value];
  var typeIndex = table.index[cols.type];
  if (keyIndex === undefined) {
    return [];
  }
  return table.rows
    .map(function (row) {
      return {
        key: String(row[keyIndex]),
        value: valueIndex === undefined ? '' : String(row[valueIndex]),
        type: typeIndex === undefined ? 'text' : String(row[typeIndex]),
      };
    })
    .filter(function (row) {
      return row.key !== '';
    });
}

function readTable_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { index: {}, rows: [] };
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var index = indexHeaders_(headers);
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = values.filter(function (row) {
    return row.some(function (cell) {
      return !isEmpty_(cell);
    });
  });
  return { index: index, rows: rows };
}

function decodeItem_(tab, spec, row, index) {
  var item = {};

  spec.columns.forEach(function (column) {
    var position = index[column.h];
    if (position === undefined) {
      return;
    }
    setPath_(item, column.k, decodeCell_(row[position], column));
  });

  (SHEETS_SCHEMA.nullGroups[tab] || []).forEach(function (group) {
    var columns = spec.columns.filter(function (column) {
      return column.k.indexOf(group + '.') === 0;
    });
    var allEmpty = columns.every(function (column) {
      var position = index[column.h];
      return position === undefined || isEmpty_(row[position]);
    });
    if (columns.length && allEmpty) {
      item[group] = null;
    }
  });

  var extrasPosition = index[SHEETS_SCHEMA.extrasHeader];
  if (extrasPosition !== undefined && !isEmpty_(row[extrasPosition])) {
    var extras = JSON.parse(String(row[extrasPosition]));
    Object.keys(extras).forEach(function (key) {
      if (item[key] === undefined) {
        item[key] = extras[key];
      }
    });
  }

  return item;
}

function decodeCell_(raw, column) {
  if (isEmpty_(raw)) {
    if (column.n) {
      return null;
    }
    if (column.t === 'text') {
      return '';
    }
    if (column.t === 'bool') {
      return false;
    }
    return null;
  }
  if (column.t === 'number') {
    return Number(raw);
  }
  if (column.t === 'bool') {
    var text = String(raw).trim().toUpperCase();
    return text === 'SIM' || text === 'TRUE' || text === 'VERDADEIRO';
  }
  return String(raw);
}

function decodeSetting_(type, text) {
  switch (type) {
    case 'number':
      return Number(text);
    case 'boolean':
      return text === 'true';
    case 'null':
      return null;
    case 'json':
      return JSON.parse(text);
    default:
      return text;
  }
}

// ---------------------------------------------------------------- gravação

function writeSnapshot_(ss, snapshot) {
  Object.keys(SHEETS_SCHEMA.collections).forEach(function (tab) {
    writeCollection_(ss, tab, snapshot[SHEETS_SCHEMA.collections[tab].source]);
  });
  writeSettings_(ss, snapshot);
}

function writeCollection_(ss, tab, items) {
  var sheet = ensureSheet_(ss, tab);
  var spec = SHEETS_SCHEMA.collections[tab];
  var headers = ensureHeaders_(sheet, expectedHeaders_(tab));
  var index = indexHeaders_(headers);
  var rows = items.map(function (item) {
    return encodeItem_(item, spec, headers, index);
  });
  replaceData_(sheet, headers.length, rows);
}

function writeSettings_(ss, snapshot) {
  var sheet = ensureSheet_(ss, SHEETS_SCHEMA.settingsTab);
  var cols = SHEETS_SCHEMA.settingsColumns;
  var headers = ensureHeaders_(sheet, [cols.key, cols.value, cols.type]);
  var index = indexHeaders_(headers);
  var rows = settingsRows_(snapshot).map(function (entry) {
    var row = headers.map(function () {
      return '';
    });
    row[index[cols.key]] = entry.key;
    row[index[cols.value]] = entry.value;
    row[index[cols.type]] = entry.type;
    return row;
  });
  replaceData_(sheet, headers.length, rows);
}

function encodeItem_(item, spec, headers, index) {
  var row = headers.map(function () {
    return '';
  });
  var covered = {};

  spec.columns.forEach(function (column) {
    covered[column.k.split('.')[0]] = true;
    var position = index[column.h];
    if (position !== undefined) {
      row[position] = encodeCell_(getPath_(item, column.k), column);
    }
  });

  var extras = {};
  Object.keys(item).forEach(function (key) {
    if (!covered[key]) {
      extras[key] = item[key];
    }
  });
  var extrasPosition = index[SHEETS_SCHEMA.extrasHeader];
  if (extrasPosition !== undefined && Object.keys(extras).length) {
    row[extrasPosition] = JSON.stringify(extras);
  }

  return row;
}

function encodeCell_(value, column) {
  if (value === null || value === undefined) {
    return '';
  }
  if (column.t === 'bool') {
    return value ? 'SIM' : 'NÃO';
  }
  return String(value);
}

function settingsRows_(snapshot) {
  var reserved = {};
  Object.keys(SHEETS_SCHEMA.collections).forEach(function (tab) {
    reserved[SHEETS_SCHEMA.collections[tab].source] = true;
  });

  var rows = [];
  Object.keys(snapshot).forEach(function (key) {
    if (reserved[key]) {
      return;
    }
    var value = snapshot[key];
    if (isPlainObject_(value)) {
      Object.keys(value).forEach(function (sub) {
        rows.push(settingEntry_(key + '.' + sub, value[sub]));
      });
    } else {
      rows.push(settingEntry_(key, value));
    }
  });
  return rows;
}

function settingEntry_(key, value) {
  var type = valueType_(value);
  var text = type === 'null' ? '' : type === 'json' ? JSON.stringify(value) : String(value);
  return { key: key, value: text, type: type };
}

function valueType_(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'string') {
    return 'text';
  }
  return 'json';
}

function replaceData_(sheet, width, rows) {
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), width);
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  if (rows.length) {
    var target = sheet.getRange(2, 1, rows.length, width);
    target.setNumberFormat('@');
    target.setValues(rows);
  }
}

// ---------------------------------------------------------------- abas e cabeçalhos

function expectedHeaders_(tab) {
  return SHEETS_SCHEMA.collections[tab].columns
    .map(function (column) {
      return column.h;
    })
    .concat([SHEETS_SCHEMA.extrasHeader]);
}

function ensureSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

/** Mantém a ordem das colunas que já existem na planilha e acrescenta as que faltam. */
function ensureHeaders_(sheet, expected) {
  var lastCol = sheet.getLastColumn();
  var current = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (header) {
        return String(header).trim();
      })
    : [];

  var headers = current.slice();
  while (headers.length && headers[headers.length - 1] === '') {
    headers.pop();
  }
  expected.forEach(function (name) {
    if (headers.indexOf(name) < 0) {
      headers.push(name);
    }
  });

  var changed = headers.length !== current.length || headers.some(function (header, position) {
    return header !== current[position];
  });
  if (changed) {
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
    range.setFontWeight('bold');
  }
  return headers;
}

function indexHeaders_(headers) {
  var index = {};
  headers.forEach(function (header, position) {
    var name = String(header).trim();
    if (name !== '' && index[name] === undefined) {
      index[name] = position;
    }
  });
  return index;
}

// ---------------------------------------------------------------- utilidades

function isEmpty_(value) {
  return value === '' || value === null || value === undefined;
}

function isPlainObject_(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getPath_(obj, path) {
  return path.split('.').reduce(function (current, part) {
    return current === null || current === undefined ? undefined : current[part];
  }, obj);
}

function setPath_(obj, path, value) {
  var parts = path.split('.');
  var current = obj;
  for (var i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
