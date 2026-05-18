# SPEC

## Escopo

Sistema de apontamento operacional para UMBs e caminhões, com frontend no GitHub Pages, Firestore direto e suporte offline com sincronização.

## Atores

- Operador: acessa apenas o painel de apontamento.
- Cliente: acessa apenas o dashboard de supervisão.
- Gerente: acessa todas as telas e administra usuários.

## Regras de Negócio

- Usuário operacional somente visualiza/aponta atividades.
- Cliente somente visualiza o dashboard e não administra usuários.
- Gerente pode criar, editar, ativar, desativar e excluir usuários.
- Senhas continuam validadas pelo aplicativo sobre o snapshot persistido.
- Cada usuário pode ter no máximo um apontamento aberto.
- Cada equipamento pode ter no máximo um apontamento aberto.
- Ao iniciar uma nova atividade, o sistema encerra automaticamente o apontamento aberto anterior do mesmo operador.
- O módulo operacional trabalha com um único turno implícito; não há seleção nem gestão de turnos na interface.
- O operador encerra manualmente o apontamento em aberto no fim do expediente pelo botão `Encerrar a atividade`, exibido abaixo da tabela `Histórico do dia` no fim da página.
- O botão `Recarregar Atualização do Sistema` recarrega a interface sem apagar `localStorage`, `IndexedDB` ou apontamentos já salvos.
- Os campos `Local`, `Descrição da falha`, `Ação corretiva` e `Tipo / Classificação` deixam de ser editados pelo operador; a classificação passa a ser derivada do código da atividade.
- O dashboard de `Hoje` contabiliza apontamentos em aberto imediatamente, mesmo antes de completar 1 minuto, para manter o resumo ao vivo.
- Intervalos que incluem o dia atual atualizam em tempo real; intervalos com data inicial e final iguais consideram o dia completo selecionado.
- Os filtros de data do dashboard usam o dia local completo, sem deslocamento de fuso.
- O idioma da interface é persistido localmente, com `pt-BR` como padrão, e a troca de idioma não altera dados operacionais.
- Hora final deve ser maior que hora inicial.
- Lançamento manual é permitido, mas deve ser identificado.
- Tablets/dispositivos que acessam o painel operacional podem capturar GPS do navegador; o dashboard usa o último ponto salvo por equipamento para exibir o mapa.
- Quando o apontamento é encerrado, o sistema mantém o último GPS como localização final do caminhão.
- A ausência de GPS não bloqueia o apontamento nem a sincronização online; o registro continua salvo normalmente.

## Persistência

- Escritura primária: documento do Firestore.
- Banco persistente: Firestore.
- Espelho local: `localStorage` e `IndexedDB`, usados como cache e fila offline.
- No boot, o sistema inicializa o Firebase e restaura o snapshot mais recente entre Firestore e cache local.
- As alterações são sincronizadas no documento central do Firestore após cada gravação.
- O navegador é solicitado a manter o armazenamento como persistente.
- Apontamentos abertos permanecem salvos no Firestore e podem ser retomados após fechar a aba ou trocar de dispositivo.

## Validações

- Configuração deve existir e estar íntegra.
- Seeds devem conter usuários, equipamentos, turnos e códigos válidos.
- O sistema não pode iniciar sem restaurar um snapshot válido do Firestore ou do seed inicial.
- O gerente continua sendo o único administrador de usuários.

## Saídas Esperadas

- Tela de login por usuário.
- Tela operacional.
- Dashboard com intervalo selecionável e gráficos de pizza de disponibilidade, utilização e códigos por UMR.
- Botão de recarga do sistema nas telas logadas.
- Backups JSON e CSV.
- Administração restrita de usuários.
