# PIPELINE

## Sequência de Execução

1. Inicializar aplicação via `src/main.jsx`.
2. Executar `bootstrapStorage()`.
3. Solicitar persistência do navegador.
4. Inicializar Firebase web SDK e Firestore, sem autenticação anônima obrigatória.
5. Ler `localStorage`, `IndexedDB` e snapshot do Firestore.
6. Escolher o snapshot mais recente.
7. Restaurar sessão local, se existir e ainda for válida.
8. Renderizar login ou painel conforme papel do usuário, com cliente em dashboard-only, operação sem seleção de turno e idioma da interface persistido localmente.
9. No painel operacional, capturar GPS do navegador quando disponível e sincronizar o último ponto do apontamento aberto.
10. Ao iniciar uma nova atividade, encerrar automaticamente o apontamento anterior do mesmo operador.
11. Persistir qualquer alteração no cache local e sincronizar com o documento do Firestore.
12. Permitir exportação/importação JSON e exportação CSV.
13. Renderizar o dashboard com intervalo selecionável, atualização ao vivo para qualquer intervalo que inclua `Hoje`, mapa da frota com base satélite do Google Maps usando o último `gps` por equipamento e gráficos de pizza por período/UMR.
14. Encerrar manualmente o apontamento em aberto ao fim do expediente pelo botão `Encerrar a atividade` abaixo da tabela `Histórico do dia` no fim do módulo de operação.
15. Permitir `Recarregar Atualização do Sistema` para buscar a versão mais recente sem tocar em `localStorage` ou `IndexedDB`.
16. Escutar alterações remotas do Firestore e reaplicar no cache local.
17. Validar integridade com `tests/smoke.mjs` e build.

## Falhas

- Se o Firestore falhar, o sistema continua com cache local e fila de sincronização.
- Se `IndexedDB` falhar, o sistema continua com `localStorage`.
- Se `localStorage` falhar, o espelho em `IndexedDB` preserva a base.
- Se ambos falharem, o sistema reidrata com seed inicial documentado.
