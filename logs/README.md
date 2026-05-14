# LOGS

Registro lógico de eventos do sistema.

## Propósito

- Rastrear boot, persistência, importação, exportação e validações.

## Estrutura recomendada

```json
{
  "timestamp": "ISO-8601",
  "level": "INFO|WARN|ERROR",
  "scope": "storage|auth|export|import|validation|ui",
  "message": "texto curto",
  "context": {}
}
```

## Política

- Logs operacionais devem ser curtos e reproduzíveis.
- Eventos críticos devem ser vinculados ao registro afetado.
- Retenção e exportação futura devem ser definidas em `config.json`.
