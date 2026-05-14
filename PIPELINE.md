# PIPELINE

## Sequência de Execução

1. Inicializar aplicação via `src/main.jsx`.
2. Executar `bootstrapStorage()`.
3. Solicitar persistência do navegador.
4. Inicializar Firebase web SDK e Firestore, sem autenticação anônima obrigatória.
5. Ler `localStorage`, `IndexedDB` e snapshot do Firestore.
6. Escolher o snapshot mais recente.
7. Restaurar sessão local, se existir e ainda for válida.
8. Renderizar login ou painel conforme papel do usuário.
9. Ao iniciar uma nova atividade, encerrar automaticamente o apontamento anterior do mesmo operador.
10. Persistir qualquer alteração no cache local e sincronizar com o documento do Firestore.
11. Permitir exportação/importação JSON e exportação CSV.
12. Encerrar manualmente o apontamento em aberto ao fim do expediente pelo botão `Encerrar a atividade`.
13. Escutar alterações remotas do Firestore e reaplicar no cache local.
14. Validar integridade com `tests/smoke.mjs` e build.

## Falhas

- Se o Firestore falhar, o sistema continua com cache local e fila de sincronização.
- Se `IndexedDB` falhar, o sistema continua com `localStorage`.
- Se `localStorage` falhar, o espelho em `IndexedDB` preserva a base.
- Se ambos falharem, o sistema reidrata com seed inicial documentado.
