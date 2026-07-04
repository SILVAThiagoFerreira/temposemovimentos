# Sistema de Tempos e Movimentos - UMB / Caminhões

Sistema web PWA para apontamento operacional em tablets, com frontend no GitHub Pages, Firestore direto e cache local para operação offline.

## Objetivo

Registrar atividades, paradas e duração por equipamento em campo, com acesso por perfil, dashboard para clientes e histórico auditável.

## Entradas

- Usuário selecionado e senha.
- Apontamentos operacionais.
- Cadastros de equipamentos, atividades e turnos.
- Compras/notas fiscais seedadas ou importadas para analytics de dashboard.
- Arquivos JSON de backup/importação.

## Processamento

- `src/main.jsx` inicia o bootstrap do armazenamento.
- `src/services/storageService.js` restaura o snapshot local, sincroniza com o Firestore, encerra automaticamente o apontamento anterior quando uma nova atividade inicia e mantém o espelho em `localStorage` e `IndexedDB`, incluindo a coleção `purchases`.
- `src/services/firebaseClient.js` inicializa o Firebase web SDK sem exigir sessão anônima.
- `src/pages/Login.jsx` autentica por usuário e recupera a sessão, roteando clientes para o dashboard.
- `src/pages/OperatorPanel.jsx` executa o fluxo operacional.
- `src/pages/Settings.jsx` administra usuários somente para gerente.

## Saídas

- Tela operacional.
- Dashboard de supervisão para clientes e gerentes.
- Dashboard com gráficos de compras mensais, blastbags e composição de compras.
- Exportação CSV.
- Backup JSON.
- Dados persistidos entre reinícios de navegador, troca de dispositivo e reabertura da aba.

## Padrao visual

- Interface clean com predominio de branco e off-white.
- Fundo com grade quadrada sutil, sem efeitos escuros ou promocionais.
- Cartoes com borda fina, sombra leve e cantos contidos.
- Logo OpenBlast pequena e discreta nas areas de marca.
- Contraste alto no texto e uso minimo de cores fora dos estados de status.

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
