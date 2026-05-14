# Sistema de Tempos e Movimentos - UMB / Caminhões

Sistema web PWA para apontamento operacional em tablets, com persistência local reforçada, exportação e base pronta para evolução online.

## Objetivo

Registrar atividades, paradas e duração por equipamento em campo, com acesso por perfil e histórico auditável.

## Entradas

- Usuário selecionado e senha.
- Apontamentos operacionais.
- Cadastros de equipamentos, atividades e turnos.
- Arquivos JSON de backup/importação.

## Processamento

- `src/main.jsx` inicia o bootstrap do armazenamento.
- `src/services/storageService.js` restaura e espelha dados em `localStorage` e `IndexedDB`.
- `src/pages/Login.jsx` autentica por usuário fixo.
- `src/pages/OperatorPanel.jsx` executa o fluxo operacional.
- `src/pages/Settings.jsx` administra usuários somente para gerente.

## Saídas

- Tela operacional.
- Dashboard de supervisão.
- Exportação CSV.
- Backup JSON.
- Dados persistidos entre reinícios de navegador e limpeza de cache local.

## Validação

- Build do projeto: `npm run build`.
- Smoke test de estrutura/config: `npm test`.
- Validação completa: `npm run validate`.

## Execução

1. `npm install`
2. `npm run dev`
3. `npm test`
4. `npm run build`
5. `npm run validate`

## Estrutura principal

- `config.json` - fonte central de parâmetros e seeds.
- `src/` - aplicação.
- `input/` - шаблões e entradas.
- `output/` - saídas esperadas.
- `logs/` - referência de logs.
- `tests/` - validações.

## Publicação

O deploy está preparado para GitHub Pages via GitHub Actions.
