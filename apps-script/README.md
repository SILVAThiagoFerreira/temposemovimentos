# Backend em Google Sheets (Apps Script)

Este diretório guarda o código do backend que usa a planilha **BASE DE DADOS - TEMPOS E MOVIMENTOS**, na pasta **TEMPOS E MOVIMENTOS** do Google Drive.

- `schema.js` — esquema das abas e colunas (fonte única; ver `DATA_SCHEMA.md`, seção "Planilha").
- `Code.gs` — endpoints `doGet` / `doPost`, leitura, gravação com lock, `criarAbas()`.
- `appsscript.json` — manifesto (fuso, escopo da planilha, web app).

O app usa este backend quando `config.json` tem `storage.backend = "sheets"` e `sheets.webAppUrl` preenchido. Com `"firestore"` (padrão), nada muda.

## Como implantar

1. Abra a planilha **BASE DE DADOS - TEMPOS E MOVIMENTOS** no Drive.
2. Menu **Extensões > Apps Script**. O projeto nasce ligado à planilha.
3. Substitua o conteúdo de `Código.gs` pelo arquivo `Code.gs` e crie um arquivo de script chamado `schema` com o conteúdo de `schema.js`.
4. Salve (Ctrl+S). No seletor de função, escolha **criarAbas** e clique em **Executar**. Autorize o acesso à planilha quando o Google pedir (apenas escopo de planilhas).
5. **Implantar > Nova implantação > Tipo: App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL terminada em `/exec` e cole em `config.json`:
   - `sheets.webAppUrl` = a URL;
   - `storage.backend` = `"sheets"` (só depois de testar).
7. Teste no navegador: `URL?action=ping` deve responder `{"ok":true,"schemaVersion":1}`.

## Ações da API

| Chamada | Efeito |
| --- | --- |
| `GET ?action=ping` | versão do esquema |
| `GET ?action=version` | só o `updatedAt` (polling leve, a cada 30 s) |
| `GET ?action=snapshot` | snapshot completo; `null` se a planilha não tiver usuários |
| `POST {action:"save", snapshot}` | grava o snapshot inteiro, substituindo o conteúdo das abas |

Gravações sem usuários são recusadas. Leituras e gravações usam o lock do script.

## Regras de operação

- **Não digite dados nas abas.** O app regrava as abas inteiras a cada alteração; edições manuais são sobrescritas no próximo envio.
- Para voltar a um estado anterior use **Arquivo > Histórico de versões** da planilha.
- Na primeira abertura com abas vazias, o app grava o cadastro inicial (inclui as senhas do seed).
- A planilha guarda as senhas do login em texto. Mantenha o acesso restrito à conta dona.

## Riscos conhecidos (aceitos com a decisão de usar Apps Script)

- **Endpoint público:** quem tiver a URL consegue ler e gravar. É o mesmo nível de exposição das regras atuais do Firestore; o próximo passo é autenticação no servidor e senhas com hash.
- **Cotas:** o polling de 4 aparelhos a cada 30 s consome execuções. Em conta gratuita a cota diária é menor. Recomendado: conta Google Workspace, ou aumentar o intervalo em `sheets.pollIntervalSeconds`. Acompanhe em **Execuções** do projeto.
- **Concorrência:** gravações são de snapshot completo (última gravação vence), como já era no Firestore.

## Migração a partir do Firestore

1. Em um aparelho atualizado, use **Dados > Exportar JSON** (backup completo).
2. Publique a configuração com `storage.backend = "sheets"`.
3. Em **Dados > Importar JSON**, escolha o backup. O app grava o conteúdo na planilha.
4. Confirme pela planilha (abas `usuarios` e `registros`).
5. Todos os aparelhos precisam atualizar antes de operar; aparelhos com versão antiga continuam gravando no Firestore.
