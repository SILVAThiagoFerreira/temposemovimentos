# INPUT

Entradas suportadas pelo sistema.

## Tipos

- Backup JSON exportado pelo próprio sistema.
- Arquivo JSON de restauração manual.

## Contrato

- O arquivo deve seguir o formato descrito em `DATA_SCHEMA.md`.
- O arquivo deve conter `operators`, `equipments`, `activityTypes`, `shifts`, `movementRecords` e `settings`.

## Observação

- Este diretório documenta o padrão de entrada. A importação real é feita pela interface web.
