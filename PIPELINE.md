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
9. Persistir qualquer alteração no cache local e sincronizar com o documento do Firestore.
10. Permitir exportação/importação JSON e exportação CSV.
11. Escutar alterações remotas do Firestore e reaplicar no cache local.
12. Validar integridade com `tests/smoke.mjs` e build.

## Falhas

- Se o Firestore falhar, o sistema continua com cache local e fila de sincronização.
- Se `IndexedDB` falhar, o sistema continua com `localStorage`.
- Se `localStorage` falhar, o espelho em `IndexedDB` preserva a base.
- Se ambos falharem, o sistema reidrata com seed inicial documentado.
