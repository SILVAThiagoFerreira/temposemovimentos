# TASK

## Tarefa Atual

Estruturar o projeto como sistema auditável e escalável, com frontend no GitHub Pages, planilha do Google Drive, persistência permanente, documentação obrigatória e validação reproduzível para apontamentos de tempos e movimentos.

## Decisões Vigentes

- Aplicação web PWA permanece como entrega principal.
- `src/main.jsx` continua sendo o entrypoint web.
- `config.json` concentra seeds e parâmetros operacionais.
- Persistência primária passa a ser planilha do Google Drive no frontend.
- `localStorage` e `IndexedDB` continuam como cache/espelho offline.
- O shell visual do frontend segue padrao clean com identidade Enaex (cinza `#38424B`, vermelho `#E20613`), sem textos de apoio e com navegacao por icones. Decisao de 2026-11-18: a marca OpenBlast deixou a interface; ver README, secao "Padrao visual".

## Critério de Conclusão

- Documentação completa.
- Configuração externa centralizada.
- Testes/validações executáveis.
- Build do projeto funcional.
- Publicação online automática via GitHub Pages.

## Decisão 2026-11-18: base em Google Sheets (Apps Script)

- Escolha do responsável: usar a planilha da pasta TEMPOS E MOVIMENTOS como base, por meio de Apps Script.
- Exceção à restrição "Não criar dependência de backend para a Fase 1". O Apps Script é um backend mínimo.
- Trade-offs: endpoint público (acesso sem login Google, por decisão do responsável), cotas, polling em vez de tempo real, gravação de snapshot completo.
- Firestore removido do projeto em 2026-11-18, a pedido do responsável. A base começa vazia; não há migração de histórico.
- Pendências: autenticação no servidor, senhas com hash, conta Workspace e acompanhamento das execuções.
