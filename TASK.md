# TASK

## Tarefa Atual

Estruturar o projeto como sistema auditável e escalável, com frontend no GitHub Pages, Firestore/Auth direto, persistência permanente, documentação obrigatória, validação reproduzível e analytics de compras/blastbags no dashboard.

## Decisões Vigentes

- Aplicação web PWA permanece como entrega principal.
- `src/main.jsx` continua sendo o entrypoint web.
- `config.json` concentra seeds e parâmetros operacionais, incluindo o catálogo de compras usado nos gráficos do dashboard.
- Persistência primária passa a ser Firestore direto no frontend.
- `localStorage` e `IndexedDB` continuam como cache/espelho offline.
- O shell visual do frontend segue padrao clean em branco/off-white, com geometria quadrada e marca OpenBlast discreta.

## Critério de Conclusão

- Documentação completa.
- Configuração externa centralizada.
- Testes/validações executáveis.
- Build do projeto funcional.
- Publicação online automática via GitHub Pages.
