# Sistema de Tempos e Movimentos - UMB / Caminhões

Sistema web PWA para apontamento operacional em tablets, com frontend no GitHub Pages, Firestore direto e cache local para operação offline.

## Objetivo

Registrar atividades, paradas e duração por equipamento em campo, com acesso por perfil e histórico auditável.

## Entradas

- Usuário selecionado e senha.
- Apontamentos operacionais.
- Cadastros de equipamentos, atividades e turnos.
- Arquivos JSON de backup/importação.

## Processamento

- `src/main.jsx` inicia o bootstrap do armazenamento.
- `src/services/storageService.js` restaura o snapshot local, sincroniza com o Firestore, encerra automaticamente o apontamento anterior quando uma nova atividade inicia e mantém o espelho em `localStorage` e `IndexedDB`.
- `src/services/firebaseClient.js` inicializa o Firebase web SDK sem exigir sessão anônima.
- `src/pages/Login.jsx` autentica por usuário e recupera a sessão.
- `src/pages/OperatorPanel.jsx` executa o fluxo operacional.
- `src/pages/Settings.jsx` administra usuários somente para gerente.

## Saídas

- Tela operacional.
- Dashboard de supervisão.
- Exportação CSV.
- Backup JSON.
- Dados persistidos entre reinícios de navegador, troca de dispositivo e reabertura da aba.

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

O Firebase web config já está em `config.json`.

## Estrutura principal

- `config.json` - fonte central de parâmetros e seeds.
- `src/` - aplicação.
- `input/` - шаблões e entradas.
- `output/` - saídas esperadas.
- `logs/` - referência de logs.
- `tests/` - validações.

## Publicação

O frontend é publicado no GitHub Pages e sincroniza direto com Firestore.

## Deploy

- Nenhum segredo é necessário para o build do GitHub Pages.
- Se mudar as regras do Firestore, publique `firestore.rules` com o Firebase CLI.
