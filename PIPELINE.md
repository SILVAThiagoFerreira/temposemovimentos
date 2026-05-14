# PIPELINE

## Sequência de Execução

1. Inicializar aplicação via `src/main.jsx`.
2. Executar `bootstrapStorage()`.
3. Solicitar persistência do navegador.
4. Ler `localStorage` e `IndexedDB`.
5. Escolher o snapshot mais recente.
6. Restaurar sessão e base local.
7. Renderizar login ou painel conforme papel do usuário.
8. Persistir qualquer alteração em memória, `localStorage` e `IndexedDB`.
9. Permitir exportação/importação JSON e exportação CSV.
10. Validar integridade com `tests/smoke.mjs` e build.

## Falhas

- Se `IndexedDB` falhar, o sistema continua com `localStorage`.
- Se `localStorage` falhar, o espelho em `IndexedDB` preserva a base.
- Se ambos falharem, o sistema reidrata com seed inicial documentado.
