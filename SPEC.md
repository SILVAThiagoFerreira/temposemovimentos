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
- O operador encerra manualmente o apontamento em aberto no fim do expediente pelo botão `Encerrar a atividade`, exibido no rodapé da página e mantido fixo em tablets para não cobrir o conteúdo.
- Os campos `Local`, `Descrição da falha`, `Ação corretiva` e `Tipo / Classificação` deixam de ser editados pelo operador; a classificação passa a ser derivada do código da atividade.
- Hora final deve ser maior que hora inicial.
- Lançamento manual é permitido, mas deve ser identificado.

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
- Backups JSON e CSV.
- Administração restrita de usuários.
