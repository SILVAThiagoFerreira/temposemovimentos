# PIPELINE

## Sequência de Execução

1. Inicializar aplicação via `src/main.jsx`.
1.1. Registrar o service worker com bypass de cache de atualização e iniciar verificação periódica de novos assets da PWA.
2. Executar `bootstrapStorage()`.
3. Solicitar persistência do navegador.
4. Inicializar Firebase web SDK e Firestore, sem autenticação anônima obrigatória.
5. Ler `localStorage`, `IndexedDB` e snapshot do Firestore.
6. Escolher o snapshot mais recente.
7. Restaurar sessão local, se existir e ainda for válida.
8. Renderizar login ou painel conforme papel do usuário, com cliente em dashboard-only, operação sem seleção de turno e idioma da interface persistido localmente.
9. No painel operacional, capturar GPS do navegador quando disponível e sincronizar o último ponto do apontamento aberto.
10. Ao iniciar uma nova atividade, encerrar automaticamente o apontamento anterior do mesmo operador.
10.1. Executar o auto-encerramento noturno configurado em `config.json`, fechando em lote os apontamentos em aberto cujo limite 19:00/03:00 já venceu.
11. Persistir qualquer alteração no cache local e sincronizar com o documento do Firestore.
11.1. Se a sincronização remota falhar, manter o snapshot local como pendente e tentar reenviar no boot, no evento `online`, no retorno da tela ao primeiro plano e em ciclo periódico.
11.2. Expor telemetria local de sincronização no painel de configurações, incluindo estado da fila, contagem de falhas e atraso de retentativa.
12. Permitir exportação/importação JSON e exportação CSV.
13. Renderizar o dashboard com intervalo selecionável, atualização ao vivo para qualquer intervalo que inclua `Hoje`, mapa da frota com base satélite do Google Maps, travado para navegação manual e autoajustado aos apontamentos ativos com GPS, além de gráficos de rosca para KPIs, disponibilidade/utilização por UMR e pizza por período/UMR.
14. Encerrar manualmente o apontamento em aberto ao fim do expediente pelo botão `Encerrar a atividade` abaixo da tabela `Histórico do dia` no fim do módulo de operação.
15. Permitir `Recarregar Atualização do Sistema` para buscar a versão mais recente sem tocar em `localStorage` ou `IndexedDB`.
16. Atualizar automaticamente a PWA em intervalo periódico quando houver conexão, usando rede primeiro para HTML/assets e cache apenas como fallback offline.
17. Escutar alterações remotas do Firestore e reaplicar no cache local.
18. Para entrega Android, executar `npm run android:sync` para atualizar a configuração nativa que abre `https://silvathiagoferreira.github.io/temposemovimentos/`.
19. Quando houver SDK Android disponível, executar `npm run android:build` para gerar o APK debug instalável.
20. Validar integridade com `tests/smoke.mjs`, suíte completa de testes e build.

## Falhas

- Se o Firestore falhar, o sistema continua com cache local e fila de sincronização.
- Se `IndexedDB` falhar, o sistema continua com `localStorage`.
- Se `localStorage` falhar, o espelho em `IndexedDB` preserva a base.
- Se ambos falharem, o sistema reidrata com seed inicial documentado.
- Se a rede falhar durante atualização da PWA, o service worker mantém a versão em cache e tenta novamente no próximo ciclo.
- Se a rede falhar no aplicativo Android após ao menos uma abertura online, o service worker do GitHub Pages usa os assets em cache e o WebView mantém o snapshot local em `localStorage`/`IndexedDB`; a sincronização remota é retomada nas próximas gravações com conexão.
