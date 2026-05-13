# Sistema de Tempos e Movimentos - UMB / Caminhões

Aplicação web 100% front-end para tablets, com foco em apontamento operacional offline, exportação local e preparo para integração online futura.

## Fase 1 - MVP Offline

- Login local do operador.
- Apontamento de atividades/paradas.
- Controle de atividade aberta.
- Dashboard local.
- Exportação CSV.
- Backup e restore JSON.
- PWA instalável.
- Cache básico para uso offline.

## Fase 2 - Modo Online

A arquitetura já separa a camada de persistência em `storageService.js`. No futuro, basta trocar o motor local por Firebase Firestore ou Supabase sem reescrever a interface.

Possíveis integrações:

- Firebase Firestore
- Supabase
- API própria
- Power BI
- Google Sheets
- Banco SQL

## Estrutura

- `src/pages` - telas do sistema.
- `src/components` - blocos reutilizáveis.
- `src/services` - storage, exportação e cálculos.
- `src/data` - cadastros iniciais.
- `src/utils` - datas, validações e IDs.

## Execução local

1. Instale dependências: `npm install`
2. Rode em desenvolvimento: `npm run dev`
3. Gere build: `npm run build`
4. Teste build local: `npm run preview`

## GitHub Pages

O projeto já vem com:

- `vite.config.js` com base relativa.
- `public/404.html` para suportar rotas do app.
- `public/sw.js` para funcionamento offline.
- Workflow em `.github/workflows/deploy.yml`.

### Publicação

1. Faça push para `main`.
2. No repositório, ative GitHub Pages com origem em **GitHub Actions**.
3. O workflow faz build e publica automaticamente.

## Observação importante

Os dados ficam no navegador do tablet. Para supervisão em tempo real em outra tela, será necessário migrar para Firebase, Supabase ou outra base centralizada.

## Rotas

O app usa navegação por hash para simplificar o deploy no GitHub Pages.

- `#/login`
- `#/operador`
- `#/dashboard`
- `#/cadastros`
- `#/dados`
- `#/configuracoes`
