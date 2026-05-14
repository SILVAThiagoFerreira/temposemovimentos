# DATA_SCHEMA

## config.json

```json
{
  "meta": {},
  "storage": {},
  "auth": {},
  "seed": {},
  "validation": {},
  "exports": {}
}
```

## User

```json
{
  "id": "usr-paulo",
  "name": "Paulo",
  "registration": "",
  "role": "OPERADOR",
  "password": "1234",
  "shiftId": "shift-1",
  "shiftName": "1º TURNO",
  "active": true,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

## Session

```json
{
  "operatorId": "usr-paulo",
  "operatorName": "Paulo",
  "registration": "",
  "role": "OPERADOR",
  "shiftId": "shift-1",
  "shiftName": "1º TURNO",
  "loggedAt": "ISO-8601"
}
```

## MovementRecord

```json
{
  "id": "mov-...",
  "operatorId": "usr-paulo",
  "operatorName": "Paulo",
  "registration": "",
  "shiftId": "shift-1",
  "shiftName": "1º TURNO",
  "equipmentId": "eq-beg-8a40",
  "plate": "BEG-8A40",
  "equipmentCode": "UMR-1072",
  "location": "CHASSI",
  "activityTypeId": "act-01",
  "activityCode": "01",
  "activityName": "Recarregando emulsão",
  "classification": "OPERAÇÃO",
  "failureDescription": "",
  "correctiveAction": "",
  "notes": "",
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
  "settings": {}
}
```

## StorageMeta

```json
{
  "persistentStorageGranted": true,
  "indexedDbAvailable": true,
  "bootstrappedAt": "ISO-8601"
}
```
