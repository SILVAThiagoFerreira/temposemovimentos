# PROMPT

Use este projeto como uma base operacional auditável.

## Interpretação

- Considere `config.json` a fonte de verdade.
- Considere `SPEC.md` como regra funcional.
- Considere `PIPELINE.md` como ordem de execução.
- Considere `DATA_SCHEMA.md` como contrato de dados.

## Forma de trabalho

- Arquitetura primeiro, implementação depois.
- Não ocultar decisões implícitas.
- Validar qualquer alteração por testes e build.
- Atualizar documentação sempre que a lógica mudar.

## Restrições

- Não simplificar para atalhos não documentados.
- Não mover o entrypoint sem atualizar a documentação.
- Não introduzir dependência de backend na Fase 1.
