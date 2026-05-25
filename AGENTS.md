# AGENTS

Regras permanentes para agentes que atuarem neste projeto.

## Comportamento

- Trate `config.json` como fonte de verdade para parâmetros, seeds e nomes de armazenamento.
- Preserve `src/main.jsx` como ponto de entrada da aplicação web.
- Antes de alterar regras, atualize `SPEC.md` e `DATA_SCHEMA.md`.
- Nunca introduza lógica crítica em arquivo único.
- Documente decisões explícitas, especialmente quando houver trade-off.

## Restrições técnicas

- Não remover o modo offline/local.
- Não eliminar o espelhamento em `IndexedDB`.
- Não hardcodar chaves de storage, seeds ou regras de acesso no código funcional.
- Não criar dependência de backend para a Fase 1.

## Qualidade

- Validar com `npm test` e `npm run build` antes de concluir.
- Garantir que novos campos tenham esquema documentado.
- Garantir que mudanças de autenticação mantenham o gerente como único administrador de usuários.

## Evolução

- Se houver mudança de fluxo, atualize `PIPELINE.md`.
- Se houver mudança de formato, atualize `DATA_SCHEMA.md`.
- Se houver mudança de regra, atualize `SPEC.md`.
