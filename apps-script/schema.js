/**
 * Esquema da base em Google Sheets (fonte única para o Apps Script e para os testes).
 *
 * Cada aba corresponde a uma coleção do snapshot do app.
 *   h = cabeçalho na planilha (nome que aparece para o usuário)
 *   k = caminho no objeto do app (ex.: gps.latitude)
 *   t = tipo: text | datetime | number | bool (SIM/NÃO na planilha)
 *   n = true quando o valor vazio vira null; false quando vira '' (texto) ou false (bool)
 *
 * Campos do app que não estão listados aqui são gravados em extras_json, para não se perderem.
 * Ver DATA_SCHEMA.md, seção "Planilha".
 */
var SHEETS_SCHEMA = {
  version: 1,
  extrasHeader: 'extras_json',
  settingsTab: 'configuracoes',
  settingsColumns: { key: 'chave', value: 'valor', type: 'tipo' },
  nullGroups: {
    registros: ['gps'],
  },
  collections: {
    usuarios: {
      source: 'operators',
      columns: [
        { h: 'id', k: 'id', t: 'text', n: false },
        { h: 'nome', k: 'name', t: 'text', n: false },
        { h: 'matricula', k: 'registration', t: 'text', n: false },
        { h: 'perfil', k: 'role', t: 'text', n: false },
        { h: 'senha', k: 'password', t: 'text', n: false },
        { h: 'turno_id', k: 'shiftId', t: 'text', n: true },
        { h: 'turno_nome', k: 'shiftName', t: 'text', n: false },
        { h: 'ativo', k: 'active', t: 'bool', n: true },
        { h: 'criado_em', k: 'createdAt', t: 'datetime', n: true },
        { h: 'atualizado_em', k: 'updatedAt', t: 'datetime', n: true },
      ],
    },
    equipamentos: {
      source: 'equipments',
      columns: [
        { h: 'id', k: 'id', t: 'text', n: false },
        { h: 'placa', k: 'plate', t: 'text', n: false },
        { h: 'codigo', k: 'code', t: 'text', n: false },
        { h: 'descricao', k: 'description', t: 'text', n: false },
        { h: 'ativo', k: 'active', t: 'bool', n: true },
        { h: 'criado_em', k: 'createdAt', t: 'datetime', n: true },
        { h: 'atualizado_em', k: 'updatedAt', t: 'datetime', n: true },
      ],
    },
    atividades: {
      source: 'activityTypes',
      columns: [
        { h: 'id', k: 'id', t: 'text', n: false },
        { h: 'codigo', k: 'code', t: 'text', n: false },
        { h: 'nome', k: 'name', t: 'text', n: false },
        { h: 'classificacao', k: 'classification', t: 'text', n: false },
        { h: 'local_padrao', k: 'defaultLocation', t: 'text', n: true },
        { h: 'ativo', k: 'active', t: 'bool', n: true },
        { h: 'criado_em', k: 'createdAt', t: 'datetime', n: true },
        { h: 'atualizado_em', k: 'updatedAt', t: 'datetime', n: true },
      ],
    },
    turnos: {
      source: 'shifts',
      columns: [
        { h: 'id', k: 'id', t: 'text', n: false },
        { h: 'nome', k: 'name', t: 'text', n: false },
        { h: 'inicio', k: 'startTime', t: 'text', n: false },
        { h: 'fim', k: 'endTime', t: 'text', n: false },
        { h: 'minutos_disponiveis', k: 'availableMinutes', t: 'number', n: true },
        { h: 'ativo', k: 'active', t: 'bool', n: true },
        { h: 'criado_em', k: 'createdAt', t: 'datetime', n: true },
        { h: 'atualizado_em', k: 'updatedAt', t: 'datetime', n: true },
      ],
    },
    registros: {
      source: 'movementRecords',
      columns: [
        { h: 'id', k: 'id', t: 'text', n: false },
        { h: 'operador_id', k: 'operatorId', t: 'text', n: false },
        { h: 'operador_nome', k: 'operatorName', t: 'text', n: false },
        { h: 'matricula', k: 'registration', t: 'text', n: false },
        { h: 'equipamento_id', k: 'equipmentId', t: 'text', n: false },
        { h: 'placa', k: 'plate', t: 'text', n: false },
        { h: 'codigo_equipamento', k: 'equipmentCode', t: 'text', n: false },
        { h: 'atividade_id', k: 'activityTypeId', t: 'text', n: false },
        { h: 'codigo_atividade', k: 'activityCode', t: 'text', n: false },
        { h: 'atividade_nome', k: 'activityName', t: 'text', n: false },
        { h: 'classificacao', k: 'classification', t: 'text', n: false },
        { h: 'inicio', k: 'startDateTime', t: 'datetime', n: false },
        { h: 'fim', k: 'endDateTime', t: 'datetime', n: true },
        { h: 'duracao_min', k: 'durationMinutes', t: 'number', n: true },
        { h: 'duracao_h', k: 'durationHours', t: 'number', n: true },
        { h: 'status', k: 'status', t: 'text', n: false },
        { h: 'manual', k: 'manualEntry', t: 'bool', n: false },
        { h: 'observacoes', k: 'notes', t: 'text', n: false },
        { h: 'gps_latitude', k: 'gps.latitude', t: 'number', n: true },
        { h: 'gps_longitude', k: 'gps.longitude', t: 'number', n: true },
        { h: 'gps_precisao_m', k: 'gps.accuracyMeters', t: 'number', n: true },
        { h: 'gps_capturado_em', k: 'gps.capturedAt', t: 'datetime', n: true },
        { h: 'gps_fonte', k: 'gps.source', t: 'text', n: true },
        { h: 'criado_em', k: 'createdAt', t: 'datetime', n: true },
        { h: 'atualizado_em', k: 'updatedAt', t: 'datetime', n: true },
        { h: 'editado_em', k: 'editedAt', t: 'datetime', n: true },
        { h: 'editado_por', k: 'editedBy', t: 'text', n: true },
        { h: 'turno_id', k: 'shiftId', t: 'text', n: true },
        { h: 'turno_nome', k: 'shiftName', t: 'text', n: false },
        { h: 'local', k: 'location', t: 'text', n: true },
        { h: 'falha_descricao', k: 'failureDescription', t: 'text', n: false },
        { h: 'acao_corretiva', k: 'correctiveAction', t: 'text', n: false },
      ],
    },
  },
};
