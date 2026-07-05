# DATA_SCHEMA

## config.json

```json
{
  "meta": {
    "name": "",
    "shortName": "",
    "version": "",
    "entrypoint": "src/main.jsx"
  },
  "storage": {
    "keys": {
      "uiLanguage": "temposemovimentos-ui-language"
    }
  },
  "automation": {
    "nightAutoClose": {
      "enabled": true,
      "startTime": "19:00",
      "endTime": "03:00"
    }
  },
  "dashboard": {},
  "firebase": {},
  "auth": {
    "defaultPassword": "1234",
    "passwordSaltRounds": 10,
    "sessionTtlHours": 24,
    "roles": {
      "operational": "OPERADOR",
      "client": "CLIENTE",
      "manager": "GERENTE"
    }
  },
  "seed": {
    "catalogVersion": 10,
    "users": [],
    "equipments": [],
    "activityTypes": [],
    "shifts": []
  },
  "validation": {},
  "exports": {}
}
```

## Automation

```json
{
  "nightAutoClose": {
    "enabled": true,
    "startTime": "19:00",
    "endTime": "03:00"
  }
}
```

- `nightAutoClose` define a janela local usada para encerrar em lote apontamentos em aberto sem apagar histórico.

## User

```json
{
  "id": "usr-paulo",
  "name": "Paulo",
  "registration": "",
  "role": "OPERADOR",
  "password": "1234",
  "active": true,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

- `role` aceita `OPERADOR`, `CLIENTE` e `GERENTE`.
- Os campos de turno deixaram de ser expostos no fluxo atual.
- `syncPassword` é um campo opcional do seed usado para sobrescrever a senha existente quando o valor do seed deve prevalecer.
- `storage.keys.uiLanguage` guarda a preferência de idioma da interface no armazenamento local.
- O aplicativo Android não altera o formato dos dados; ele usa o mesmo snapshot, as mesmas chaves de armazenamento e o mesmo documento Firestore configurados em `config.json`, carregados pela origem do GitHub Pages.

## StorageMeta

```json
{
  "persistentStorageGranted": false,
  "indexedDbAvailable": true,
  "backendConfigured": true,
  "backendAvailable": false,
  "connectionState": "OFFLINE",
  "lastRemoteSyncAt": "ISO-8601",
  "lastRemoteSyncError": "string|null",
  "lastLocalMutationAt": "ISO-8601",
  "lastSyncAttemptAt": "ISO-8601",
  "lastSyncReason": "string|null",
  "syncFailureCount": 0,
  "syncBackoffMs": 0,
  "syncPending": false,
  "bootstrappedAt": "ISO-8601"
}
```

- O painel de configurações usa esse bloco apenas para exibir estado operacional.
- Os campos não alteram o formato dos registros exportados.

## Session

```json
{
  "operatorId": "usr-paulo",
  "operatorName": "Paulo",
  "registration": "",
  "role": "OPERADOR",
  "loggedAt": "ISO-8601"
}
```

- `role` aceita `OPERADOR`, `CLIENTE` e `GERENTE`.
- A sessão não depende mais de turno visível.

## MovementDraft

```json
{
  "operatorId": "usr-paulo",
  "equipmentId": "eq-beg-8a40",
  "activityTypeId": "act-01",
  "notes": "",
  "manualEntry": false,
  "startDateTime": "YYYY-MM-DDTHH:mm",
  "endDateTime": "",
  "savedAt": "ISO-8601"
}
```

- O draft é identificado por uma chave estável derivada de `storage.keys.database`, `catalogVersion`, operador, equipamento e código da atividade, ou por `recordId` quando a tela está em edição.
- `savedAt` é usado para escolher a cópia mais recente entre `localStorage` e `IndexedDB`.

## MovementRecord

```json
{
  "id": "mov-...",
  "operatorId": "usr-paulo",
  "operatorName": "Paulo",
  "registration": "",
  "equipmentId": "eq-beg-8a40",
  "plate": "BEG-8A40",
  "equipmentCode": "UMR-1072",
  "activityTypeId": "act-01",
  "activityCode": "01",
  "activityName": "Checklist",
  "classification": "OPERAÇÃO",
  "notes": "",
  "gps": {
    "latitude": -6.123456,
    "longitude": -35.123456,
    "accuracyMeters": 12,
    "capturedAt": "ISO-8601",
    "source": "browser-geolocation"
  },
  "startDateTime": "ISO-8601",
  "endDateTime": null,
  "durationMinutes": null,
  "durationHours": null,
  "manualEntry": false,
  "status": "ABERTO",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "editedAt": null,
  "editedBy": null
}
```

## Encerramento

- Quando uma nova atividade é iniciada para o mesmo operador, o apontamento anterior aberto é encerrado automaticamente.
- O encerramento preenche `endDateTime`, `durationMinutes`, `durationHours`, `editedAt` e `editedBy`.
- O auto-encerramento noturno usa `editedBy = "SISTEMA"` e fecha os apontamentos em aberto no horário-limite configurado entre 19:00 e 03:00.
- As durações são calculadas em precisão de minuto; fechamentos automáticos registram ao menos 1 minuto quando a troca ocorre no mesmo instante.
- O botão `Encerrar a atividade` finaliza o apontamento em aberto no fim do expediente.
- `shiftId`, `shiftName`, `location`, `failureDescription` e `correctiveAction` são campos legados/históricos e não fazem parte do fluxo visível atual.
- `gps` guarda o último ponto capturado pelo navegador. Enquanto o apontamento está aberto, o painel pode atualizar esse snapshot; ao encerrar, o último ponto permanece como localização final do caminhão.

## AuditEvent

```json
{
  "id": "evt-...",
  "eventType": "state-sync",
  "scope": "database",
  "actorId": "usr-paulo",
  "actorName": "Paulo",
  "payload": {},
  "createdAt": "ISO-8601"
}
```

## BackupPayload

```json
{
  "version": 1,
  "exportedAt": "ISO-8601",
  "operators": [],
  "equipments": [],
  "activityTypes": [],
  "shifts": [],
  "movementRecords": [],
  "settings": {
    "storageMode": "ONLINE",
    "defaultShiftId": "shift-1",
    "userCatalogSeeded": true,
    "catalogVersion": 10,
    "updatedAt": "ISO-8601"
  }
}
```

## StorageMeta

```json
{
  "persistentStorageGranted": true,
  "indexedDbAvailable": true,
  "bootstrappedAt": "ISO-8601",
  "backendConfigured": true,
  "backendAvailable": true,
  "connectionState": "ONLINE",
  "lastRemoteSyncAt": "ISO-8601",
  "lastRemoteSyncError": null
}
```

- `connectionState`, `lastRemoteSyncAt` e `lastRemoteSyncError` refletem as tentativas automáticas de sincronização do snapshot local com o Firestore.

## Snapshot

```json
{
  "version": 1,
  "operators": [],
  "equipments": [],
  "activityTypes": [],
  "shifts": [],
  "movementRecords": [],
  "settings": {
    "storageMode": "ONLINE",
    "defaultShiftId": "shift-1",
    "userCatalogSeeded": true,
    "catalogVersion": 10,
    "updatedAt": "ISO-8601"
  }
}
```
