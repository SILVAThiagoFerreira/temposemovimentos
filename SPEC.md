# SPEC

## Escopo

Sistema de apontamento operacional para UMBs e caminhões, com foco em campo, tablet e uso offline.

## Atores

- Operador: acessa apenas o painel de apontamento.
- Gerente: acessa todas as telas e administra usuários.

## Regras de Negócio

- Usuário operacional somente visualiza/aponta atividades.
- Gerente pode criar, editar, ativar, desativar e excluir usuários.
- Cada usuário pode ter no máximo um apontamento aberto.
- Cada equipamento pode ter no máximo um apontamento aberto.
- Hora final deve ser maior que hora inicial.
- Lançamento manual é permitido, mas deve ser identificado.

## Persistência

- Escritura primária: `localStorage`.
- Espelho: `IndexedDB`.
- No boot, o sistema restaura o snapshot mais recente disponível.
- O navegador é solicitado a manter o armazenamento como persistente.

## Validações

- Configuração deve existir e estar íntegra.
- Seeds devem conter usuários, equipamentos, turnos e códigos válidos.
- O sistema não pode iniciar sem restauração de dados inicial.

## Saídas Esperadas

- Tela de login por usuário.
- Tela operacional.
- Dashboard.
- Backups JSON e CSV.
- Administração restrita de usuários.
