# PIPELINE

## Sequência de Execução

1. Inicializar aplicação via `src/main.jsx`.
2. Executar `bootstrapStorage()`.
3. Solicitar persistência do navegador.
4. Inicializar Firebase web SDK e Firestore, sem autenticação anônima obrigatória.
5. Ler `localStorage`, `IndexedDB` e snapshot do Firestore.
6. Escolher o snapshot mais recente.
7. Restaurar sessão local, se existir e ainda for válida.
8. Renderizar login ou painel conforme papel do usuário, com cliente em dashboard-only e operação sem seleção de turno.
9. Ao iniciar uma nova atividade, encerrar automaticamente o apontamento anterior do mesmo operador.
10. Persistir qualquer alteração no cache local e sincronizar com o documento do Firestore.
11. Permitir exportação/importação JSON e exportação CSV.
12. Renderizar o dashboard com intervalo selecionável, atualização ao vivo para qualquer intervalo que inclua `Hoje` e gráficos de pizza por período/UMR.
13. Encerrar manualmente o apontamento em aberto ao fim do expediente pelo botão `Encerrar a atividade` abaixo da tabela `Histórico do dia` no fim do módulo de operação.
14. Permitir `Recarregar Atualização do Sistema` para buscar a versão mais recente sem tocar em `localStorage` ou `IndexedDB`.
15. Escutar alterações remotas do Firestore e reaplicar no cache local.
16. Validar integridade com `tests/smoke.mjs` e build.

## Falhas

- Se o Firestore falhar, o sistema continua com cache local e fila de sincronização.
- Se `IndexedDB` falhar, o sistema continua com `localStorage`.
- Se `localStorage` falhar, o espelho em `IndexedDB` preserva a base.
- Se ambos falharem, o sistema reidrata com seed inicial documentado.
