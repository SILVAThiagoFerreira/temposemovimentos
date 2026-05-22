export const DEFAULT_LOCALE = 'pt-BR';

export const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'zh-CN'];

const LOCALE_ALIASES = {
  pt: 'pt-BR',
  'pt-br': 'pt-BR',
  'pt_br': 'pt-BR',
  en: 'en-US',
  'en-us': 'en-US',
  'en_us': 'en-US',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh_cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh_hans': 'zh-CN',
};

const messages = {
  'pt-BR': {
    app: { name: 'Sistema de Tempos e Movimentos - UMB / Caminhões', shortName: 'Tempos UMB' },
    language: {
      selector: 'Idioma da interface',
      options: { 'pt-BR': 'Português (Brasil)', 'en-US': 'Inglês', 'zh-CN': 'Chinês' },
    },
    roles: { operator: 'Operador', client: 'Cliente', manager: 'Gerenciador', operador: 'Operador', cliente: 'Cliente', gerente: 'Gerenciador' },
    connection: { local: 'LOCAL / SEM REDE', online: 'CONECTADO' },
    common: {
      loading: 'Carregando...',
      updateSystem: 'Atualizar sistema',
      installApp: 'Instalar aplicativo',
      logout: 'Sair',
      save: 'Salvar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Excluir',
      activate: 'Ativar',
      deactivate: 'Desativar',
      enter: 'Entrar',
      active: 'Ativo',
      inactive: 'Inativo',
      open: 'ABERTO',
      closed: 'ENCERRADO',
      manual: 'MANUAL',
      free: 'LIVRE',
      busy: 'APONTAMENTO EM ABERTO',
      noActivity: 'SEM ATIVIDADE',
      none: 'Nenhum',
      noData: 'Sem dados',
      noRecords: 'Nenhum registro encontrado.',
      noTitle: 'Sem título',
      noCode: 'Sem código',
      noPlate: 'Sem placa',
      optional: 'Opcional',
      available: 'Disponível',
      hoursLabel: 'Horas',
      recordsLabel: 'registros',
      operation: 'Operação',
      maintenance: 'Manutenção',
      meal: 'Refeição',
      criticalIntervals: 'Intervalos críticos',
      idleHours: 'Horas ociosas',
      other: 'Outros',
      target: 'Meta',
      updatedAt: 'Atualizado em',
      records: { one: '{{count}} registro', other: '{{count}} registros' },
      events: { one: '{{count}} evento', other: '{{count}} eventos' },
      usersRegistered: { one: '{{count}} cadastrado', other: '{{count}} cadastrados' },
      selectUser: 'Selecione um usuário.',
      enterPassword: 'Informe a senha.',
      selectEquipment: 'Selecione um equipamento',
      confirmDelete: 'Confirmar exclusão?',
    },
    routeTitles: {
      login: 'Sistema de Operações ENAEX',
      operator: 'Painel do operador',
      dashboard: 'Painel da frota',
      registrations: 'Base operacional',
      export: 'Dados e exportação',
      settings: 'Administração do sistema',
      default: 'Sistema de Tempos e Movimentos',
    },
    header: { eyebrow: 'ENAEX // Sistema de Operações', subtitle: 'Operação de UMR em tempo real' },
    navigation: {
      title: 'Área de trabalho',
      active: '{{role}} ATIVO',
      login: 'ENTRAR',
      items: {
        operator: { label: 'Apontar', helper: 'Registro de tempo' },
        dashboard: { label: 'Painel', helper: 'Indicadores da frota' },
        registrations: { label: 'Base', helper: 'Dados operacionais' },
        export: { label: 'Dados', helper: 'Exportações' },
        settings: { label: 'Sistema', helper: 'Administração' },
      },
    },
    login: {
      hero: {
        title: 'TEMPOS E MOVIMENTOS',
        copy: 'Selecione o perfil. Confirme a senha. Siga a operação.',
        stats: { operators: 'operadores', clients: 'clientes', managers: 'gerenciadores', active: 'ativos' },
        brand: 'Sistema de Operações',
      },
      form: { eyebrow: 'Entrada segura', title: 'Escolha o perfil', status: 'Acesso autorizado', empty: 'Nenhum usuário ativo disponível.', password: 'Senha', passwordPlaceholder: 'Digite a senha', submit: 'Entrar no sistema' },
      errors: { generic: 'Falha ao entrar.' },
    },
    dashboard: {
      banner: { eyebrow: 'Operação ao vivo', title: 'Painel da frota', copy: 'Disponibilidade, utilização e paradas.' },
      filters: { eyebrow: 'Janela de análise', today: 'Hoje', live: 'Ao vivo', interval: 'Intervalo', startDate: 'Data inicial', endDate: 'Data final', rangeConnector: 'a' },
      recent: { eyebrow: 'Últimos apontamentos', title: 'Movimentação do período', empty: 'Sem registros para exibir.' },
      map: {
        eyebrow: 'Mapa da frota',
        title: 'Localização dos caminhões',
        copy: 'O painel usa o último GPS salvo em cada UMR sobre a base satélite do Google Maps. Apontamentos abertos continuam atualizando a posição; ao encerrar, o último ponto permanece como localização final.',
        empty: 'Nenhum equipamento com GPS no período selecionado.',
        count: { one: '{{count}} caminhão com GPS', other: '{{count}} caminhões com GPS' },
        activeCount: { one: '{{count}} caminhão ativo', other: '{{count}} caminhões ativos' },
        visibleCount: { one: '{{count}} no mapa', other: '{{count}} no mapa' },
        missingGps: { one: '{{count}} sem GPS', other: '{{count}} sem GPS' },
        livePoint: 'Ao vivo',
        lastPoint: 'Último apontamento',
        noGps: 'Sem GPS',
        legend: { live: 'Ao vivo', lastPoint: 'Último apontamento', noGps: 'Sem GPS' },
      },
      cards: {
        open: 'Apontamentos em aberto', openSub: 'no período selecionado',
        totalHours: 'Total de horas no período', totalHoursSub: { one: '{{count}} registro', other: '{{count}} registros' },
        stop: 'Tempo parado', stopSub: 'manutenção + ociosidade',
        maintenance: 'Tempo de manutenção', maintenanceSub: 'eventos críticos',
        closed: 'Registros encerrados', closedSub: 'no período selecionado',
        physicalAvailability: 'Disponibilidade física', physicalAvailabilitySub: 'consolidada do período',
        fleetIU: 'IU médio da frota', fleetIUSub: 'no período selecionado', periodFootnote: 'Base de {{days}} dia(s) e {{minutes}} min disponíveis.',
      },
      sections: {
        equipmentAndActivity: 'Equipamentos e atividade', activityByEquipment: 'Atividade por UMR', physicalIndicators: 'Indicadores físicos', availabilityAndUtilization: 'Disponibilidade e utilização',
        codesByEquipment: 'Códigos por UMR', quantityAndPercent: 'Quantidade e percentual por código', maintenanceByEquipment: 'Manutenção por UMR', maintenanceByActivity: 'Manutenção por atividade', mealDaily: 'Refeição diária (1h)', criticalIntervals: 'Intervalos críticos', detailByEquipment: 'Detalhe por UMR', mealAdherence: 'Aderência à refeição',
      },
      empty: { available: 'Sem dados disponíveis.', selectedPeriod: 'Sem dados no período selecionado.', maintenance: 'Sem manutenção registrada.', meal: 'Sem refeição registrada no período.', critical: 'Sem intervalos críticos no período.' },
      series: { operation: 'Operação', maintenance: 'Manutenção', meal: 'Refeição', gaps: 'Intervalos críticos', idle: 'Horas ociosas', other: 'Outros', available: 'Disponível', inOperation: 'Em operação', rest: 'Demais tempos' },
      labels: { mainInterval: 'Principal intervalo: {{value}}', noCriticalIntervals: 'Sem intervalos críticos', noCode: 'Sem código', noPlate: 'Sem placa', records: { one: '{{count}} registro', other: '{{count}} registros' }, events: { one: '{{count}} evento', other: '{{count}} eventos' } },
    },
    operator: {
      topbar: { eyebrow: 'Modo operacional', accessTotal: 'Acesso total', pointingOnly: 'Somente apontamento' },
      hero: { operator: 'Operador', activeRecord: 'Apontamento ativo', noRegistration: 'Sem matrícula', selectedEquipment: 'UMR selecionada', chooseEquipment: 'Escolha um equipamento', openRecord: 'APONTAMENTO EM ABERTO', free: 'LIVRE', openActivity: 'Atividade aberta', none: 'Nenhum', noOpenMovement: 'Sem movimentação em aberto', noActivity: 'SEM ATIVIDADE' },
      alerts: { autoClose: 'Ao iniciar a próxima atividade, a anterior será encerrada automaticamente.', busyEquipment: 'O equipamento selecionado já possui um apontamento aberto por {{name}}.', closePrompt: 'Encerrar a atividade e finalizar o expediente?' },
      form: { title: 'Novo apontamento', submit: 'Iniciar atividade', finish: 'Encerrar a atividade', history: 'Histórico do dia', count: { one: '{{count}} registro', other: '{{count}} registros' }, empty: 'Nenhum registro lançado hoje.', timer: 'Cronômetro em tempo real', equipment: 'Equipamento', activity: 'Atividade' },
    },
    registrations: {
      banner: { eyebrow: 'Cadastro mestre', title: 'Base operacional', copy: 'Equipamentos e códigos.' },
      stats: { equipments: 'Equipamentos', codes: 'Códigos' },
      equipment: { eyebrow: 'Equipamentos', title: 'Placas e UMBs', plate: 'Placa', code: 'UMB', description: 'Descrição', active: 'Ativo', add: 'Adicionar', update: 'Atualizar', edit: 'Editar', delete: 'Excluir', confirmDelete: 'Excluir equipamento?' },
      activity: { eyebrow: 'Atividades e paradas', title: 'Códigos', code: 'Código', description: 'Descrição', classification: 'Classificação', location: 'Localização', automatic: 'Automático', chassis: 'Chassi', unit: 'Unidade', active: 'Ativo', add: 'Adicionar', update: 'Atualizar', edit: 'Editar', delete: 'Excluir', confirmDelete: 'Excluir atividade/parada?' },
    },
    export: {
      banner: { eyebrow: 'Exportação de dados', title: 'Controle de registros', copy: 'Filtros, CSV, JSON e edições.' },
      filters: { date: 'Data', equipment: 'Equipamento', operator: 'Operador', code: 'Código', status: 'Situação', all: 'Todos', open: 'ABERTO', closed: 'ENCERRADO' },
      actions: { csv: 'Exportar CSV', json: 'Exportar JSON', importJson: 'Importar JSON', reset: 'Limpar base local' },
      notices: { csvSuccess: 'CSV exportado com sucesso.', jsonSuccess: 'Backup JSON exportado.', importSuccess: 'Backup importado com sucesso.', importError: 'Falha ao importar JSON.', restored: 'Base restaurada.', updated: 'Registro atualizado.', deleted: 'Registro excluído.', closed: 'Apontamento encerrado.' },
      confirm: { reset: 'Limpar a base local e restaurar os dados iniciais?', deleteRecord: 'Excluir este registro?', closeRecord: 'Encerrar este apontamento agora?' },
      edit: { title: 'Editar registro', submit: 'Salvar alteração', cancel: 'Fechar edição' },
      filteredCount: { one: '{{count}} registro filtrado', other: '{{count}} registros filtrados' },
    },
    settings: {
      banner: { eyebrow: 'Administração do sistema', title: 'Usuários e ambiente', copy: 'Usuários, PWA e armazenamento.' },
      access: { restrictedTitle: 'Acesso restrito', restrictedCopy: 'Perfil de gerente obrigatório.', noPermission: 'SEM PERMISSÃO' },
      users: { eyebrow: 'Usuários', title: 'Controle de acesso', registered: { one: '{{count}} cadastrado', other: '{{count}} cadastrados' }, name: 'Nome', namePlaceholder: 'Nome do usuário', registration: 'Matrícula', role: 'Classe', password: 'Senha', passwordPlaceholder: 'Nova senha (opcional na edição)', active: 'Ativo', create: 'Criar usuário', save: 'Salvar alteração', cancel: 'Cancelar edição', edit: 'Editar', activate: 'Ativar', deactivate: 'Desativar', delete: 'Excluir', inactive: 'Inativo', toggleStatus: 'Alternar situação', confirmDelete: 'Excluir o usuário {{name}}?', keepManager: 'É necessário manter ao menos um gerente ativo', updated: 'Usuário atualizado.', created: 'Usuário criado.', activated: 'Usuário ativado.', deactivated: 'Usuário desativado.', deleted: 'Usuário excluído.' },
      pwa: { eyebrow: 'PWA', title: 'Instalação no tablet', copy: 'O app pode ser instalado como PWA e operar offline com cache básico.', install: 'Instalar app', fallback: 'Instalação será oferecida pelo navegador compatível' },
      storage: { eyebrow: 'Armazenamento', title: 'Base sincronizada', copy: 'Os dados são gravados em cache local, espelhados em IndexedDB e sincronizados com o Firestore. O navegador também é solicitado a manter esse armazenamento como persistente.', currentState: 'Situação atual', browserPersistence: 'Persistência do navegador', secondaryBackup: 'Backup secundário', enablePersistence: 'Ativar armazenamento persistente', activated: 'Armazenamento persistente ativado.', notGranted: 'O navegador não concedeu persistência total, mas o backup em IndexedDB continua ativo.', local: 'LOCAL / SEM REDE', connected: 'CONECTADO', active: 'Ativa', notConfirmed: 'Não confirmada', indexedDbActive: 'IndexedDB ativo', unavailable: 'Indisponível' }, sync: { state: 'Fila de sync', pending: 'Pendente', idle: 'Em dia', backoff: 'Retentativa', failures: 'Falhas' },
      integrations: { eyebrow: 'Fase 2', title: 'Integrações preparadas', copy: 'Pronto para adaptar a camada de storage.', note: 'Pronto para adaptar a camada de storage.' },
      summary: { eyebrow: 'Resumo', title: 'Base carregada', activeUsers: 'Usuários ativos', activeManagers: 'Gerenciadores ativos', localStorage: 'Armazenamento local', yes: 'Sim', no: 'Não' },
      locale: { eyebrow: 'Idioma', title: 'Tradução da interface', copy: 'Escolha entre português, inglês e chinês. O idioma padrão é português do Brasil.' },
    },
    movement: {
      title: 'Apontamento operacional', newTitle: 'Novo apontamento', editTitle: 'Editar registro', submit: 'Salvar', cancel: 'Cancelar', manual: 'LANÇAMENTO MANUAL', automatic: 'HORA AUTOMÁTICA', operator: 'Operador', equipment: 'Equipamento', activityCode: 'Código da atividade/parada', notes: 'Observações', notesPlaceholder: 'Informações complementares', startDateTime: 'Data/hora inicial', endDateTime: 'Data/hora final', autoNote: 'Data e hora serão gravadas automaticamente ao iniciar', draftSaved: 'Rascunho salvo localmente', draftRestored: 'Rascunho restaurado', draftReady: 'Pronto para gravar', saving: 'Salvando...', errors: { generic: 'Não foi possível salvar o apontamento', requiredField: 'Campo obrigatório', invalidStartDateTime: 'Data/hora inicial inválida', invalidEndDateTime: 'Data/hora final inválida', endAfterStart: 'Hora final deve ser maior que a inicial', invalidShift: 'Turno inválido' },
    },
    table: { headers: { date: 'Data', equipment: 'Equipamento', code: 'Código', activity: 'Atividade', operator: 'Operador', start: 'Início', end: 'Fim', duration: 'Duração', status: 'Situação', actions: 'Ações' }, empty: 'Nenhum registro encontrado.', footnote: 'Atualizado em {{value}}', edit: 'Editar', close: 'Encerrar', delete: 'Excluir', manual: 'MANUAL', open: 'ABERTO', closed: 'ENCERRADO' },
    equipmentCard: { open: 'ABERTO', active: 'ATIVO', inactive: 'INATIVO', available: 'Disponível para apontamento', ready: 'Pronto para operação' },
    timer: { title: 'Tempo decorrido', ended: 'Encerrado em {{value}}', started: 'Iniciado em {{value}}' },
    chart: { eyebrow: 'Análise', empty: 'Sem dados no período.', noTitle: 'Sem título' },
    csv: { headers: { id: 'ID', operator: 'Operador', plate: 'Placa', equipment: 'UMB', code: 'Código', activity: 'Atividade', startDate: 'Data inicial', startTime: 'Hora inicial', endDate: 'Data final', endTime: 'Hora final', durationMinutes: 'Duração em minutos', durationHours: 'Duração em horas', notes: 'Observações', status: 'Situação', createdAt: 'Criado em', updatedAt: 'Atualizado em' } },
    classifications: { operation: 'OPERAÇÃO', maintenance: 'MANUTENÇÃO', idle: 'OCIOSIDADE', other: 'OUTROS' },
    locations: { automatic: 'Automático', chassis: 'Chassi', unit: 'Unidade' },
    errors: { generic: 'Falha inesperada.', userInactiveOrNotFound: 'Usuário inativo ou não encontrado', invalidPassword: 'Senha inválida', operatorNotFound: 'Operador não encontrado', equipmentNotFound: 'Equipamento não encontrado', activityTypeInvalid: 'Código de atividade/parada inválido', recordNotFound: 'Registro não encontrado', recordAlreadyClosed: 'O apontamento já está encerrado', lastManagerActive: 'Não é permitido excluir o último gerente ativo', removeLastManager: 'Não é permitido remover o último gerente ativo', shiftNotFound: 'Turno não encontrado', saveMovement: 'Falha ao salvar o apontamento', importJson: 'Falha ao importar JSON.', saveUser: 'Falha ao salvar usuário.', saveSettings: 'Falha ao salvar configurações.' },
  },
  'en-US': {
    app: { name: 'Time and Motion System - UMR / Trucks', shortName: 'UMR Times' },
    language: { selector: 'Interface language', options: { 'pt-BR': 'Portuguese (Brazil)', 'en-US': 'English', 'zh-CN': 'Chinese' } },
    roles: { operator: 'Operator', client: 'Client', manager: 'Manager', operador: 'Operator', cliente: 'Client', gerente: 'Manager' },
    connection: { local: 'LOCAL / OFFLINE', online: 'CONNECTED' },
    common: { loading: 'Loading...', updateSystem: 'Update system', installApp: 'Install app', logout: 'Sign out', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', activate: 'Activate', deactivate: 'Deactivate', enter: 'Enter', active: 'Active', inactive: 'Inactive', open: 'OPEN', closed: 'CLOSED', manual: 'MANUAL', free: 'FREE', busy: 'OPEN RECORD', noActivity: 'NO ACTIVITY', none: 'None', noData: 'No data', noRecords: 'No records found.', noTitle: 'Untitled', noCode: 'No code', noPlate: 'No plate', optional: 'Optional', available: 'Available', hoursLabel: 'Hours', recordsLabel: 'records', operation: 'Operation', maintenance: 'Maintenance', meal: 'Meal', criticalIntervals: 'Critical intervals', idleHours: 'Idle hours', other: 'Other', target: 'Target', updatedAt: 'Updated at', records: { one: '{{count}} record', other: '{{count}} records' }, events: { one: '{{count}} event', other: '{{count}} events' }, usersRegistered: { one: '{{count}} registered', other: '{{count}} registered' }, selectUser: 'Select a user.', enterPassword: 'Enter the password.', selectEquipment: 'Select an equipment', confirmDelete: 'Confirm deletion?' },
    routeTitles: { login: 'ENAEX Operations System', operator: 'Operator panel', dashboard: 'Fleet dashboard', registrations: 'Operational base', export: 'Data and export', settings: 'System administration', default: 'Time and Motion System' },
    header: { eyebrow: 'ENAEX // Operations System', subtitle: 'Real-time UMR operation' },
    navigation: { title: 'Workspace', active: '{{role}} ACTIVE', login: 'SIGN IN', items: { operator: { label: 'Record', helper: 'Time tracking' }, dashboard: { label: 'Dashboard', helper: 'Fleet indicators' }, registrations: { label: 'Base', helper: 'Operational data' }, export: { label: 'Data', helper: 'Exports' }, settings: { label: 'System', helper: 'Administration' } } },
    login: { hero: { eyebrow: 'ENAEX // Field Control', title: 'Fleet time, no noise.', copy: 'Select the profile. Confirm the password. Keep the operation moving.', chips: { roles: 'Role-based profiles', sync: 'Live sync enabled', offline: 'Works offline' }, stats: { operators: 'operators', clients: 'clients', managers: 'managers', active: 'active' }, brand: 'Operations System' }, form: { eyebrow: 'Secure sign-in', title: 'Choose a profile', status: 'Authorized access', empty: 'No active users available.', password: 'Password', passwordPlaceholder: 'Enter the password', submit: 'Sign in' }, errors: { generic: 'Sign-in failed.' } },
    dashboard: { banner: { eyebrow: 'Live operation', title: 'Fleet dashboard', copy: 'Availability, utilization, and stops.' }, filters: { eyebrow: 'Analysis window', today: 'Today', live: 'Live', interval: 'Interval', startDate: 'Start date', endDate: 'End date' }, recent: { eyebrow: 'Latest records', title: 'Period activity', empty: 'No records to show.' }, map: { eyebrow: 'Fleet map', title: 'Truck location', copy: 'The dashboard uses the last GPS saved for each UMR on the Google Maps satellite base. Open records keep updating position; when closed, the last point remains as the final location.', empty: 'No equipment with GPS in the selected period.', count: { one: '{{count}} truck with GPS', other: '{{count}} trucks with GPS' }, activeCount: { one: '{{count}} active truck', other: '{{count}} active trucks' }, visibleCount: { one: '{{count}} on map', other: '{{count}} on map' }, missingGps: { one: '{{count}} without GPS', other: '{{count}} without GPS' }, livePoint: 'Live', lastPoint: 'Last record', noGps: 'No GPS', legend: { live: 'Live', lastPoint: 'Last record', noGps: 'No GPS' } }, cards: { open: 'Open records', openSub: 'in the selected period', totalHours: 'Total hours in period', totalHoursSub: { one: '{{count}} record', other: '{{count}} records' }, stop: 'Stop time', stopSub: 'maintenance + idle', maintenance: 'Maintenance time', maintenanceSub: 'critical events', closed: 'Closed records', closedSub: 'in the selected period', physicalAvailability: 'Physical availability', physicalAvailabilitySub: 'period total', fleetIU: 'Fleet average IU', fleetIUSub: 'in the selected period' }, sections: { equipmentAndActivity: 'Equipment and activity', activityByEquipment: 'Activity by UMR', physicalIndicators: 'Physical indicators', availabilityAndUtilization: 'Availability and utilization', codesByEquipment: 'Codes by UMR', quantityAndPercent: 'Count and percent by code', maintenanceByEquipment: 'Maintenance by UMR', maintenanceByActivity: 'Maintenance by activity', mealDaily: 'Daily meal (1h)', criticalIntervals: 'Critical intervals', detailByEquipment: 'Details by UMR', mealAdherence: 'Meal adherence' }, empty: { available: 'No data available.', selectedPeriod: 'No data in the selected period.', maintenance: 'No maintenance recorded.', meal: 'No meal recorded in the period.', critical: 'No critical intervals in the period.' }, series: { operation: 'Operation', maintenance: 'Maintenance', meal: 'Meal', gaps: 'Critical intervals', idle: 'Idle hours', other: 'Other', available: 'Available', inOperation: 'In operation', rest: 'Other time' }, labels: { mainInterval: 'Main interval: {{value}}', noCriticalIntervals: 'No critical intervals', noCode: 'No code', noPlate: 'No plate', records: { one: '{{count}} record', other: '{{count}} records' }, events: { one: '{{count}} event', other: '{{count}} events' } }, },
    operator: { topbar: { eyebrow: 'Operational mode', accessTotal: 'Full access', pointingOnly: 'Pointing only' }, hero: { operator: 'Operator', activeRecord: 'Active record', noRegistration: 'No registration', selectedEquipment: 'Selected UMR', chooseEquipment: 'Choose an equipment', openRecord: 'OPEN RECORD', free: 'FREE', openActivity: 'Open activity', none: 'None', noOpenMovement: 'No open movement', noActivity: 'NO ACTIVITY' }, alerts: { autoClose: 'When the next activity starts, the previous one will be closed automatically.', busyEquipment: 'The selected equipment already has an open record by {{name}}.', closePrompt: 'Close the activity and end the shift?' }, form: { title: 'New record', submit: 'Start activity', finish: 'Close activity', history: 'Today\'s history', count: { one: '{{count}} record', other: '{{count}} records' }, empty: 'No records logged today.', timer: 'Live timer', equipment: 'Equipment', activity: 'Activity' } },
    registrations: { banner: { eyebrow: 'Master data', title: 'Operational base', copy: 'Equipment and codes.' }, stats: { equipments: 'Equipment', codes: 'Codes' }, equipment: { eyebrow: 'Equipment', title: 'Plates and UMRs', plate: 'Plate', code: 'UMR', description: 'Description', active: 'Active', add: 'Add', update: 'Update', edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete equipment?' }, activity: { eyebrow: 'Activities and stops', title: 'Codes', code: 'Code', description: 'Description', classification: 'Classification', location: 'Location', automatic: 'Automatic', chassis: 'Chassis', unit: 'Unit', active: 'Active', add: 'Add', update: 'Update', edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete activity/stop?' } },
    export: { banner: { eyebrow: 'Data export', title: 'Record control', copy: 'Filters, CSV, JSON, and edits.' }, filters: { date: 'Date', equipment: 'Equipment', operator: 'Operator', code: 'Code', status: 'Status', all: 'All', open: 'OPEN', closed: 'CLOSED' }, actions: { csv: 'Export CSV', json: 'Export JSON', importJson: 'Import JSON', reset: 'Clear local base' }, notices: { csvSuccess: 'CSV exported successfully.', jsonSuccess: 'JSON backup exported.', importSuccess: 'Backup imported successfully.', importError: 'Failed to import JSON.', restored: 'Base restored.', updated: 'Record updated.', deleted: 'Record deleted.', closed: 'Record closed.' }, confirm: { reset: 'Clear the local base and restore the initial data?', deleteRecord: 'Delete this record?', closeRecord: 'Close this record now?' }, edit: { title: 'Edit record', submit: 'Save changes', cancel: 'Close editor' }, filteredCount: { one: '{{count}} filtered record', other: '{{count}} filtered records' } },
    settings: { banner: { eyebrow: 'System administration', title: 'Users and environment', copy: 'Users, PWA, and storage.' }, access: { restrictedTitle: 'Restricted access', restrictedCopy: 'Manager profile required.', noPermission: 'NO ACCESS' }, users: { eyebrow: 'Users', title: 'Access control', registered: { one: '{{count}} registered', other: '{{count}} registered' }, name: 'Name', registration: 'Registration', role: 'Class', password: 'Password', passwordPlaceholder: 'New password (optional on edit)', active: 'Active', create: 'Create user', save: 'Save changes', cancel: 'Cancel edit', edit: 'Edit', activate: 'Activate', deactivate: 'Deactivate', delete: 'Delete', inactive: 'Inactive', confirmDelete: 'Delete user {{name}}?', keepManager: 'At least one active manager must remain', updated: 'User updated.', created: 'User created.', activated: 'User activated.', deactivated: 'User deactivated.', deleted: 'User deleted.' }, pwa: { eyebrow: 'PWA', title: 'Tablet installation', copy: 'The app can be installed as a PWA and run offline with basic cache.', install: 'Install app', fallback: 'Installation will be offered by a compatible browser' }, storage: { eyebrow: 'Storage', title: 'Synced base', copy: 'Data is stored in local cache, mirrored in IndexedDB, and synced with Firestore. The browser is also asked to keep this storage persistent.', currentState: 'Current state', browserPersistence: 'Browser persistence', secondaryBackup: 'Secondary backup', enablePersistence: 'Enable persistent storage', activated: 'Persistent storage enabled.', notGranted: 'The browser did not grant full persistence, but the IndexedDB backup is still active.', local: 'LOCAL / OFFLINE', connected: 'CONNECTED', active: 'Active', notConfirmed: 'Not confirmed', indexedDbActive: 'IndexedDB active', unavailable: 'Unavailable' }, sync: { state: 'Sync queue', pending: 'Pending', idle: 'Healthy', backoff: 'Retry delay', failures: 'Failures' }, integrations: { eyebrow: 'Phase 2', title: 'Prepared integrations', copy: 'Ready to adapt the storage layer.' }, summary: { eyebrow: 'Summary', title: 'Loaded base', activeUsers: 'Active users', activeManagers: 'Active managers', localStorage: 'Local storage', yes: 'Yes', no: 'No' }, locale: { eyebrow: 'Language', title: 'Interface translation', copy: 'Choose between Portuguese, English, and Chinese. The default language is Brazilian Portuguese.' } },
    movement: { title: 'Operational record', newTitle: 'New record', editTitle: 'Edit record', submit: 'Save', cancel: 'Cancel', manual: 'MANUAL ENTRY', automatic: 'AUTO TIME', operator: 'Operator', equipment: 'Equipment', activityCode: 'Activity/stop code', notes: 'Notes', notesPlaceholder: 'Additional information', startDateTime: 'Start date/time', endDateTime: 'End date/time', autoNote: 'Date and time will be recorded automatically when starting', draftSaved: 'Draft saved locally', draftRestored: 'Draft restored', draftReady: 'Ready to save', saving: 'Saving...', errors: { generic: 'Could not save the record', requiredField: 'Required field', invalidStartDateTime: 'Invalid start date/time', invalidEndDateTime: 'Invalid end date/time', endAfterStart: 'End time must be greater than start time', invalidShift: 'Invalid shift' } },
    table: { headers: { date: 'Date', equipment: 'Equipment', code: 'Code', activity: 'Activity', operator: 'Operator', start: 'Start', end: 'End', duration: 'Duration', status: 'Status', actions: 'Actions' }, empty: 'No records found.', footnote: 'Updated at {{value}}', edit: 'Edit', close: 'Close', delete: 'Delete', manual: 'MANUAL', open: 'OPEN', closed: 'CLOSED' },
    equipmentCard: { open: 'OPEN', active: 'ACTIVE', inactive: 'INACTIVE', available: 'Available for recording', ready: 'Ready for operation' },
    timer: { title: 'Elapsed time', ended: 'Closed at {{value}}', started: 'Started at {{value}}' },
    chart: { eyebrow: 'Analysis', empty: 'No data in the period.', noTitle: 'Untitled' },
    csv: { headers: { id: 'ID', operator: 'Operator', plate: 'Plate', equipment: 'UMR', code: 'Code', activity: 'Activity', startDate: 'Start date', startTime: 'Start time', endDate: 'End date', endTime: 'End time', durationMinutes: 'Duration in minutes', durationHours: 'Duration in hours', notes: 'Notes', status: 'Status', createdAt: 'Created at', updatedAt: 'Updated at' } },
    classifications: { operation: 'OPERATION', maintenance: 'MAINTENANCE', idle: 'IDLE', other: 'OTHER' },
    locations: { automatic: 'Automatic', chassis: 'Chassis', unit: 'Unit' },
    errors: { generic: 'Unexpected failure.', userInactiveOrNotFound: 'User inactive or not found', invalidPassword: 'Invalid password', operatorNotFound: 'Operator not found', equipmentNotFound: 'Equipment not found', activityTypeInvalid: 'Invalid activity/stop code', recordNotFound: 'Record not found', recordAlreadyClosed: 'The record is already closed', lastManagerActive: 'The last active manager cannot be deleted', removeLastManager: 'The last active manager cannot be removed', shiftNotFound: 'Shift not found', saveMovement: 'Could not save the record', importJson: 'Failed to import JSON.', saveUser: 'Could not save the user.', saveSettings: 'Could not save the settings.' },
  },
  'zh-CN': {
    app: { name: '工时与运转系统 - UMR / 卡车', shortName: 'UMR 工时' },
    language: { selector: '界面语言', options: { 'pt-BR': '葡萄牙语（巴西）', 'en-US': '英语', 'zh-CN': '中文' } },
    roles: { operator: '操作员', client: '客户', manager: '经理', operador: '操作员', cliente: '客户', gerente: '经理' },
    connection: { local: '本地 / 离线', online: '已连接' },
    common: { loading: '加载中...', updateSystem: '更新系统', installApp: '安装应用', logout: '退出', save: '保存', cancel: '取消', edit: '编辑', delete: '删除', activate: '启用', deactivate: '停用', enter: '进入', active: '启用中', inactive: '已停用', open: '打开', closed: '已关闭', manual: '手动', free: '空闲', busy: '已有记录打开', noActivity: '无活动', none: '无', noData: '无数据', noRecords: '未找到记录。', noTitle: '无标题', noCode: '无代码', noPlate: '无车牌', optional: '可选', available: '可用', hoursLabel: '工时', recordsLabel: '条记录', operation: '作业', maintenance: '维护', meal: '餐休', criticalIntervals: '关键间隔', idleHours: '闲置时间', other: '其他', target: '目标', updatedAt: '更新时间', records: { one: '{{count}} 条记录', other: '{{count}} 条记录' }, events: { one: '{{count}} 个事件', other: '{{count}} 个事件' }, usersRegistered: { one: '{{count}} 人已注册', other: '{{count}} 人已注册' }, selectUser: '请选择用户。', enterPassword: '请输入密码。', selectEquipment: '请选择设备', confirmDelete: '确认删除？' },
    routeTitles: { login: 'ENAEX 运营系统', operator: '操作员面板', dashboard: '车队看板', registrations: '运营基础', export: '数据与导出', settings: '系统管理', default: '工时与运转系统' },
    header: { eyebrow: 'ENAEX // 运营系统', subtitle: 'UMR 实时作业' },
    navigation: { title: '工作区', active: '{{role}} 启用中', login: '登录', items: { operator: { label: '记录', helper: '时间登记' }, dashboard: { label: '看板', helper: '车队指标' }, registrations: { label: '基础', helper: '运营数据' }, export: { label: '数据', helper: '导出' }, settings: { label: '系统', helper: '管理' } } },
    login: { hero: { eyebrow: 'ENAEX // 现场控制', title: '车队时间，清晰可见。', copy: '选择角色。确认密码。继续作业。', chips: { roles: '按角色分配', sync: '实时同步', offline: '可离线运行' }, stats: { operators: '操作员', clients: '客户', managers: '经理', active: '启用' }, brand: '运营系统' }, form: { eyebrow: '安全登录', title: '选择角色', status: '已授权访问', empty: '没有可用的活动用户。', password: '密码', passwordPlaceholder: '请输入密码', submit: '登录系统' }, errors: { generic: '登录失败。' } },
    dashboard: { banner: { eyebrow: '实时作业', title: '车队看板', copy: '可用率、利用率和停机。' }, filters: { eyebrow: '分析窗口', today: '今天', live: '实时', interval: '区间', startDate: '开始日期', endDate: '结束日期' }, recent: { eyebrow: '最新记录', title: '期间作业', empty: '暂无可显示的记录。' }, map: { eyebrow: '车队地图', title: '卡车位置', copy: '看板使用每台 UMR 最后保存的 GPS 点，并显示在 Google Maps 卫星底图上。打开的记录会继续更新位置；关闭后保留最后位置。', empty: '所选期间没有带 GPS 的设备。', count: { one: '{{count}} 台有 GPS 的卡车', other: '{{count}} 台有 GPS 的卡车' }, activeCount: { one: '{{count}} 台活动卡车', other: '{{count}} 台活动卡车' }, visibleCount: { one: '{{count}} 台显示在地图上', other: '{{count}} 台显示在地图上' }, missingGps: { one: '{{count}} 台无 GPS', other: '{{count}} 台无 GPS' }, livePoint: '实时', lastPoint: '最后记录', noGps: '无 GPS', legend: { live: '实时', lastPoint: '最后记录', noGps: '无 GPS' } }, cards: { open: '打开记录', openSub: '所选期间内', totalHours: '期间总工时', totalHoursSub: { one: '{{count}} 条记录', other: '{{count}} 条记录' }, stop: '停机时间', stopSub: '维护 + 闲置', maintenance: '维护时间', maintenanceSub: '关键事件', closed: '已关闭记录', closedSub: '所选期间内', physicalAvailability: '物理可用率', physicalAvailabilitySub: '期间总计', fleetIU: '车队平均 IU', fleetIUSub: '所选期间内' }, sections: { equipmentAndActivity: '设备与活动', activityByEquipment: '按 UMR 活动', physicalIndicators: '物理指标', availabilityAndUtilization: '可用率与利用率', codesByEquipment: '按 UMR 代码', quantityAndPercent: '按代码数量与占比', maintenanceByEquipment: '按 UMR 维护', maintenanceByActivity: '按活动维护', mealDaily: '每日餐休（1 小时）', criticalIntervals: '关键间隔', detailByEquipment: '按 UMR 详情', mealAdherence: '餐休达标' }, empty: { available: '暂无数据。', selectedPeriod: '所选期间暂无数据。', maintenance: '暂无维护记录。', meal: '所选期间暂无餐休记录。', critical: '所选期间暂无关键间隔。' }, series: { operation: '作业', maintenance: '维护', meal: '餐休', gaps: '关键间隔', idle: '闲置时间', other: '其他', available: '可用', inOperation: '运行中', rest: '其他时间' }, labels: { mainInterval: '主要间隔：{{value}}', noCriticalIntervals: '无关键间隔', noCode: '无代码', noPlate: '无车牌', records: { one: '{{count}} 条记录', other: '{{count}} 条记录' }, events: { one: '{{count}} 个事件', other: '{{count}} 个事件' } } },
    operator: { topbar: { eyebrow: '作业模式', accessTotal: '全部权限', pointingOnly: '仅登记' }, hero: { operator: '操作员', activeRecord: '当前记录', noRegistration: '无工号', selectedEquipment: '已选 UMR', chooseEquipment: '请选择设备', openRecord: '记录已打开', free: '空闲', openActivity: '已打开活动', none: '无', noOpenMovement: '无打开的作业', noActivity: '无活动' }, alerts: { autoClose: '开始下一项活动时，前一项会自动关闭。', busyEquipment: '所选设备已由 {{name}} 打开一条记录。', closePrompt: '关闭当前活动并结束班次？' }, form: { title: '新记录', submit: '开始活动', finish: '关闭活动', history: '今日历史', count: { one: '{{count}} 条记录', other: '{{count}} 条记录' }, empty: '今天没有记录。', timer: '实时计时器', equipment: '设备', activity: '活动' } },
    registrations: { banner: { eyebrow: '主数据', title: '运营基础', copy: '设备与代码。' }, stats: { equipments: '设备', codes: '代码' }, equipment: { eyebrow: '设备', title: '车牌与 UMR', plate: '车牌', code: 'UMR', description: '描述', active: '启用', add: '添加', update: '更新', edit: '编辑', delete: '删除', confirmDelete: '删除设备？' }, activity: { eyebrow: '活动与停机', title: '代码', code: '代码', description: '描述', classification: '分类', location: '位置', automatic: '自动', chassis: '底盘', unit: '单元', active: '启用', add: '添加', update: '更新', edit: '编辑', delete: '删除', confirmDelete: '删除活动/停机？' } },
    export: { banner: { eyebrow: '数据导出', title: '记录控制', copy: '筛选、CSV、JSON 和编辑。' }, filters: { date: '日期', equipment: '设备', operator: '操作员', code: '代码', status: '状态', all: '全部', open: '打开', closed: '已关闭' }, actions: { csv: '导出 CSV', json: '导出 JSON', importJson: '导入 JSON', reset: '清除本地数据库' }, notices: { csvSuccess: 'CSV 导出成功。', jsonSuccess: 'JSON 备份已导出。', importSuccess: '备份导入成功。', importError: '导入 JSON 失败。', restored: '数据库已恢复。', updated: '记录已更新。', deleted: '记录已删除。', closed: '记录已关闭。' }, confirm: { reset: '清除本地数据库并恢复初始数据？', deleteRecord: '删除此记录？', closeRecord: '现在关闭此记录？' }, edit: { title: '编辑记录', submit: '保存更改', cancel: '关闭编辑' }, filteredCount: { one: '{{count}} 条筛选记录', other: '{{count}} 条筛选记录' } },
    settings: { banner: { eyebrow: '系统管理', title: '用户和环境', copy: '用户、PWA 和存储。' }, access: { restrictedTitle: '受限访问', restrictedCopy: '需要经理权限。', noPermission: '无权限' }, users: { eyebrow: '用户', title: '访问控制', registered: { one: '{{count}} 人已注册', other: '{{count}} 人已注册' }, name: '姓名', registration: '工号', role: '类别', password: '密码', passwordPlaceholder: '新密码（编辑时可选）', active: '启用', create: '创建用户', save: '保存更改', cancel: '取消编辑', edit: '编辑', activate: '启用', deactivate: '停用', delete: '删除', inactive: '已停用', confirmDelete: '删除用户 {{name}}？', keepManager: '必须保留至少一名启用中的经理', updated: '用户已更新。', created: '用户已创建。', activated: '用户已启用。', deactivated: '用户已停用。', deleted: '用户已删除。' }, pwa: { eyebrow: 'PWA', title: '平板安装', copy: '应用可作为 PWA 安装，并使用基础缓存离线运行。', install: '安装应用', fallback: '兼容浏览器会提供安装提示' }, storage: { eyebrow: '存储', title: '同步数据库', copy: '数据会写入本地缓存，镜像到 IndexedDB，并同步到 Firestore。浏览器也会被请求保持持久存储。', currentState: '当前状态', browserPersistence: '浏览器持久化', secondaryBackup: '二级备份', enablePersistence: '启用持久化存储', activated: '已启用持久化存储。', notGranted: '浏览器未授予完整持久化，但 IndexedDB 备份仍然有效。', local: '本地 / 离线', connected: '已连接', active: '启用', notConfirmed: '未确认', indexedDbActive: 'IndexedDB 已启用', unavailable: '不可用' }, sync: { state: '同步队列', pending: '待同步', idle: '正常', backoff: '重试延迟', failures: '失败次数' }, integrations: { eyebrow: '阶段 2', title: '已准备好的集成', copy: '可随时调整存储层。' }, summary: { eyebrow: '摘要', title: '已加载数据库', activeUsers: '启用用户', activeManagers: '启用经理', localStorage: '本地存储', yes: '是', no: '否' }, locale: { eyebrow: '语言', title: '界面翻译', copy: '可在葡萄牙语、英语和中文之间切换。默认语言为巴西葡萄牙语。' } },
    movement: { title: '作业记录', newTitle: '新记录', editTitle: '编辑记录', submit: '保存', cancel: '取消', manual: '手动录入', automatic: '自动时间', operator: '操作员', equipment: '设备', activityCode: '活动/停机代码', notes: '备注', notesPlaceholder: '补充信息', startDateTime: '开始日期/时间', endDateTime: '结束日期/时间', autoNote: '开始时会自动记录日期和时间', draftSaved: '草稿已本地保存', draftRestored: '草稿已恢复', draftReady: '可保存', saving: '保存中...', errors: { generic: '无法保存记录', requiredField: '必填字段', invalidStartDateTime: '开始日期/时间无效', invalidEndDateTime: '结束日期/时间无效', endAfterStart: '结束时间必须大于开始时间', invalidShift: '班次无效' } },
    table: { headers: { date: '日期', equipment: '设备', code: '代码', activity: '活动', operator: '操作员', start: '开始', end: '结束', duration: '时长', status: '状态', actions: '操作' }, empty: '未找到记录。', footnote: '更新时间 {{value}}', edit: '编辑', close: '关闭', delete: '删除', manual: '手动', open: '打开', closed: '已关闭' },
    equipmentCard: { open: '打开', active: '启用', inactive: '已停用', available: '可记录', ready: '可运行' },
    timer: { title: '已用时间', ended: '已于 {{value}} 关闭', started: '开始于 {{value}}' },
    chart: { eyebrow: '分析', empty: '该期间暂无数据。', noTitle: '无标题' },
    csv: { headers: { id: 'ID', operator: '操作员', plate: '车牌', equipment: 'UMR', code: '代码', activity: '活动', startDate: '开始日期', startTime: '开始时间', endDate: '结束日期', endTime: '结束时间', durationMinutes: '分钟时长', durationHours: '小时时长', notes: '备注', status: '状态', createdAt: '创建时间', updatedAt: '更新时间' } },
    classifications: { operation: '作业', maintenance: '维护', idle: '闲置', other: '其他' },
    locations: { automatic: '自动', chassis: '底盘', unit: '单元' },
    errors: { generic: '发生意外错误。', userInactiveOrNotFound: '用户已停用或未找到', invalidPassword: '密码无效', operatorNotFound: '未找到操作员', equipmentNotFound: '未找到设备', activityTypeInvalid: '活动/停机代码无效', recordNotFound: '未找到记录', recordAlreadyClosed: '该记录已关闭', lastManagerActive: '不能删除最后一名启用中的经理', removeLastManager: '不能移除最后一名启用中的经理', shiftNotFound: '未找到班次', saveMovement: '无法保存记录', importJson: '导入 JSON 失败。', saveUser: '无法保存用户。', saveSettings: '无法保存设置。' },
  },
};

function resolvePath(source, key) {
  return key.split('.').reduce((value, part) => (value && typeof value === 'object' ? value[part] : undefined), source);
}

function isPluralMessage(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && (Object.hasOwn(value, 'one') || Object.hasOwn(value, 'other') || Object.hasOwn(value, 'zero')));
}

function formatTemplate(template, vars = {}) {
  return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => String(vars[name] ?? ''));
}

function formatValue(value, locale, vars = {}) {
  if (isPluralMessage(value)) {
    const count = Number(vars.count ?? 0);
    const pluralRules = new Intl.PluralRules(locale);
    const category = pluralRules.select(Number.isFinite(count) ? count : 0);
    const template = value[category] ?? value.other ?? value.one ?? '';
    return formatTemplate(template, vars);
  }

  if (typeof value === 'string') {
    return formatTemplate(value, vars);
  }

  return value;
}

export function normalizeLocale(locale) {
  const raw = String(locale || DEFAULT_LOCALE).trim();
  const normalized = LOCALE_ALIASES[raw.toLowerCase()] || raw;
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : DEFAULT_LOCALE;
}

export function getMessages(locale = DEFAULT_LOCALE) {
  return messages[normalizeLocale(locale)] || messages[DEFAULT_LOCALE];
}

export function getMessage(locale, key, vars = {}) {
  const normalizedLocale = normalizeLocale(locale);
  const selected = resolvePath(messages[normalizedLocale], key) ?? resolvePath(messages[DEFAULT_LOCALE], key) ?? key;
  return formatValue(selected, normalizedLocale, vars);
}

export function createTranslator(locale = DEFAULT_LOCALE) {
  const normalizedLocale = normalizeLocale(locale);
  return (key, vars = {}) => getMessage(normalizedLocale, key, vars);
}

export function getLocaleLabel(locale, displayLocale = DEFAULT_LOCALE) {
  return getMessage(displayLocale, `language.options.${normalizeLocale(locale)}`);
}
