# App Android - Tempos e Movimentos

Aplicativo Android gerado com Capacitor a partir do mesmo frontend React usado no GitHub Pages.

## Funcionamento

- O app abre `https://silvathiagoferreira.github.io/temposemovimentos/` dentro do WebView.
- Atualizacoes publicadas no GitHub Pages passam a entrar no app Android na proxima abertura com internet.
- Depois do primeiro carregamento online, a PWA mantem assets em cache para abertura offline.
- Os apontamentos continuam salvos primeiro no dispositivo com `localStorage` e `IndexedDB` da origem do GitHub Pages.
- Quando houver internet, a mesma fila de sincronização do sistema web envia o snapshot para o Firestore configurado em `config.json`.
- O painel web continua acompanhando os dados pelo documento central do Firestore.
- O app solicita permissão de internet e localização para manter a sincronização e o GPS dos apontamentos.

## Atualizacao remota

- Mudancas de tela, textos, regras web e estilos entram pelo deploy do GitHub Pages.
- Nao e necessario reinstalar APK para receber essas mudancas depois que este APK com URL remota estiver instalado.
- Se o tablet nunca abriu o app com internet, ele ainda precisa de uma primeira abertura online para popular o cache da PWA.
- Mudancas nativas Android, como permissões, icone, nome do pacote ou plugins Capacitor, continuam exigindo novo APK.

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
