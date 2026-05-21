# App Android - Tempos e Movimentos

Aplicativo Android gerado com Capacitor a partir do mesmo frontend React usado no GitHub Pages.

## Funcionamento

- O app carrega os assets locais empacotados em `APP ANDROID/android/app/src/main/assets/public`.
- Os apontamentos continuam salvos primeiro no dispositivo com `localStorage` e `IndexedDB`.
- Quando houver internet, a mesma fila de sincronização do sistema web envia o snapshot para o Firestore configurado em `config.json`.
- O painel web continua acompanhando os dados pelo documento central do Firestore.
- O app solicita permissão de internet e localização para manter a sincronização e o GPS dos apontamentos.

## Comandos

Na raiz do projeto:

```powershell
npm run android:sync
```

Sincroniza o build web atual para o projeto Android.

```powershell
npm run android:build
```

Gera o APK debug em `APP ANDROID/android/app/build/outputs/apk/debug/app-debug.apk`.

## Requisitos para gerar APK local

- Android SDK configurado em `ANDROID_HOME` ou `ANDROID_SDK_ROOT`.
- JDK compatível com a versão do Android Gradle Plugin do projeto.

Sem o SDK Android instalado, ainda é possível validar o frontend com `npm test` e `npm run build`, mas o APK não será compilado localmente.
