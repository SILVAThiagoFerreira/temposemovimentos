// Executa o Apps Script real (apps-script/schema.js + Code.gs) em um ambiente isolado,
// com uma planilha em memória que imita os pontos do Google Sheets usados pelo projeto:
// formato de texto (@), conversão automática de números e datas quando o formato não é texto,
// e lock de script.
import fs from 'node:fs';
import vm from 'node:vm';

const APPS_SCRIPT_DIR = new URL('../../apps-script/', import.meta.url);
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const NUMBER_LIKE = /^-?\d+(\.\d+)?$/;

function cellKey(row, column) {
  return `${row},${column}`;
}

export function createMemorySpreadsheet() {
  const sheets = new Map();

  class Sheet {
    constructor(name) {
      this.name = name;
      this.cells = new Map();
      this.formats = new Map();
      this.lockCount = 0;
    }

    getLastRow() {
      let last = 0;
      for (const [key, value] of this.cells) {
        if (value === '' || value === undefined || value === null) continue;
        const row = Number(key.split(',')[0]);
        if (row > last) last = row;
      }
      return last;
    }

    getLastColumn() {
      let last = 0;
      for (const [key, value] of this.cells) {
        if (value === '' || value === undefined || value === null) continue;
        const column = Number(key.split(',')[1]);
        if (column > last) last = column;
      }
      return last;
    }

    getRange(row, column, numRows = 1, numCols = 1) {
      const sheet = this;
      return {
        getValues() {
          const out = [];
          for (let r = 0; r < numRows; r++) {
            const line = [];
            for (let c = 0; c < numCols; c++) {
              const value = sheet.cells.get(cellKey(row + r, column + c));
              line.push(value === undefined ? '' : value);
            }
            out.push(line);
          }
          return out;
        },
        setValues(values) {
          if (values.length !== numRows || values.some((line) => line.length !== numCols)) {
            throw new Error(`Dimensões incompatíveis: esperado ${numRows}x${numCols}`);
          }
          values.forEach((line, r) => {
            line.forEach((value, c) => {
              const format = sheet.formats.get(cellKey(row + r, column + c));
              let stored = value;
              if (format !== '@' && typeof value === 'string') {
                if (NUMBER_LIKE.test(value)) stored = Number(value);
                else if (ISO_LIKE.test(value)) stored = new Date(value);
              }
              sheet.cells.set(cellKey(row + r, column + c), stored);
            });
          });
          return this;
        },
        clearContent() {
          for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
              sheet.cells.set(cellKey(row + r, column + c), '');
            }
          }
          return this;
        },
        setNumberFormat(format) {
          for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
              sheet.formats.set(cellKey(row + r, column + c), format);
            }
          }
          return this;
        },
        setFontWeight() {
          return this;
        },
      };
    }
  }

  return {
    sheets,
    getSheetByName(name) {
      return sheets.get(name) || null;
    },
    insertSheet(name) {
      const sheet = new Sheet(name);
      sheets.set(name, sheet);
      return sheet;
    },
  };
}

export function createAppsScriptHarness({ spreadsheet = createMemorySpreadsheet(), scriptProperties = {} } = {}) {
  const lock = { depth: 0, acquired: 0 };
  const context = {
    JSON,
    Object,
    Array,
    String,
    Number,
    Math,
    Date,
    Error,
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput(text) {
        return {
          text,
          setMimeType() {
            return this;
          },
          getContent() {
            return this.text;
          },
        };
      },
    },
    PropertiesService: {
      getScriptProperties() {
        return { getProperty: (key) => (key in scriptProperties ? scriptProperties[key] : null) };
      },
    },
    LockService: {
      getScriptLock() {
        return {
          waitLock() {
            lock.depth += 1;
            lock.acquired += 1;
          },
          releaseLock() {
            lock.depth -= 1;
          },
        };
      },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      openById: () => spreadsheet,
    },
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('schema.js', APPS_SCRIPT_DIR), 'utf8'), context, { filename: 'schema.js' });
  vm.runInContext(fs.readFileSync(new URL('Code.gs', APPS_SCRIPT_DIR), 'utf8'), context, { filename: 'Code.gs' });

  // Respostas voltam como JSON puro, para não misturar objetos de realms diferentes.
  const plain = (value) => JSON.parse(JSON.stringify(value));

  return {
    spreadsheet,
    lock,
    get: (params) => JSON.parse(context.doGet({ parameter: params }).getContent()),
    post: (body) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(body) } }).getContent()),
    raw: (params) => context.handleRequest_(params),
    plain,
    criarAbas: () => context.criarAbas(),
    context,
  };
}
