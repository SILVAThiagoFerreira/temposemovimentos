import { DEFAULT_LOCALE, createTranslator } from './messages.js';

const ERROR_KEYS = new Map([
  ['Usuário inativo ou não encontrado', 'errors.userInactiveOrNotFound'],
  ['Senha inválida', 'errors.invalidPassword'],
  ['Operador não encontrado', 'errors.operatorNotFound'],
  ['Equipamento não encontrado', 'errors.equipmentNotFound'],
  ['Código de atividade/parada inválido', 'errors.activityTypeInvalid'],
  ['Atividade/parada não encontrada', 'errors.activityTypeInvalid'],
  ['Este equipamento já possui apontamento em aberto', 'errors.saveMovement'],
  ['Registro não encontrado', 'errors.recordNotFound'],
  ['O apontamento já está encerrado', 'errors.recordAlreadyClosed'],
  ['Não é permitido excluir o último gerente ativo', 'errors.lastManagerActive'],
  ['Não é permitido remover o último gerente ativo', 'errors.removeLastManager'],
  ['Turno não encontrado', 'errors.shiftNotFound'],
  ['Falha ao salvar o apontamento', 'errors.saveMovement'],
  ['Falha ao importar JSON.', 'errors.importJson'],
  ['Arquivo JSON inválido', 'errors.importJson'],
  ['Falha ao salvar usuário.', 'errors.saveUser'],
  ['Falha ao salvar configurações.', 'errors.saveSettings'],
  ['Firebase não configurado', 'errors.generic'],
  ['Falha ao inicializar Firebase', 'errors.generic'],
  ['Falha ao sincronizar Firebase', 'errors.generic'],
  ['Falha ao ouvir Firebase', 'errors.generic'],
  ['Hora final deve ser maior que a inicial', 'movement.errors.endAfterStart'],
]);

export function translateErrorMessage(error, locale = DEFAULT_LOCALE) {
  const translate = createTranslator(locale);
  const message = String(error?.message || error || '').trim();
  const key = ERROR_KEYS.get(message);

  if (key) {
    return translate(key);
  }

  return message || translate('errors.generic');
}
