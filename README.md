# Sistema de Tempos e Movimentos - UMB / Caminhões

Sistema web PWA para apontamento operacional em tablets, com frontend no GitHub Pages, planilha do Google Drive e cache local para operação offline.

## Objetivo

Registrar atividades, paradas e duração por equipamento em campo, com acesso por perfil, dashboard para clientes e histórico auditável.

## Entradas

- Usuário selecionado e senha.
- Apontamentos operacionais.
- Cadastros de equipamentos, atividades e turnos.
- Arquivos JSON de backup/importação.

## Processamento

- `src/main.jsx` inicia o bootstrap do armazenamento.
- `src/services/storageService.js` restaura o snapshot local, sincroniza com a planilha, encerra automaticamente o apontamento anterior quando uma nova atividade inicia e mantém o espelho em `localStorage` e `IndexedDB`.
- `src/services/sheetsClient.js` conversa com o Apps Script (planilha do Google Drive) para ler, gravar e acompanhar mudanças.
- `src/pages/Login.jsx` autentica por usuário e recupera a sessão, roteando clientes para o dashboard.
- `src/pages/OperatorPanel.jsx` executa o fluxo operacional.
- `src/pages/Settings.jsx` administra usuários somente para gerente.

## Saídas

- Tela operacional.
- Dashboard de supervisão para clientes e gerentes.
- Exportação CSV.
- Backup JSON.
- Dados persistidos entre reinícios de navegador, troca de dispositivo e reabertura da aba.

## Padrao visual

- Identidade Enaex: cinza `#38424B`, vermelho `#E20613` como acento pontual e fundo branco/off-white.
- Logo Enaex (`public/enaex-logo.png`) uma unica vez por tela, no cabecalho ou no login.
- Interface guiada por icones (SVG de traco fino em `src/components/Icon.jsx`) e dados; textos de apoio, subtitulos e descricoes ficam ocultos. Rotulos de campos permanecem para leitores de tela.
- Cartoes com borda fina, sombra leve e cantos de 6px; sem fundos escuros, gradientes ou efeitos.
- Navegacao em barra superior de icones; no operador, a tela tem grade de equipamentos, cronometro, formulario compacto e historico.

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

A URL do Apps Script fica em `config.json`, em `sheets.webAppUrl`.

## Estrutura principal

- `config.json` - fonte central de parâmetros e seeds.
- `src/` - aplicação.
- `input/` - шаблões e entradas.
- `output/` - saídas esperadas.
- `logs/` - referência de logs.
- `tests/` - validações.

## Publicação

O frontend é publicado no GitHub Pages e sincroniza direto com planilha.

## Deploy

- Nenhum segredo é necessário para o build do GitHub Pages.

## Backend de dados

- Backend único: planilha do Google Drive via Apps Script (`apps-script/README.md`).
- Backend único: planilha do Google Drive via Apps Script. Ver `apps-script/README.md`.
- Testes: `tests/sheets-roundtrip.mjs` (Apps Script real em ambiente isolado) e `tests/sheets-client.mjs` (cliente com requisições simuladas).
