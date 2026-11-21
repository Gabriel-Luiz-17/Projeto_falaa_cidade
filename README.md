# Fala Cidade 🏙️

O **Fala Cidade** é um aplicativo de participação cidadã. Com ele, qualquer pessoa pode **reportar problemas da cidade**, como buracos na rua, iluminação pública queimada, lixo acumulado ou calçadas danificadas, indicando o local no mapa.

A **prefeitura** acompanha esses reportes, prioriza o que for necessário e **resolve os problemas de forma mais rápida**. Já a **população** acompanha o andamento de cada reporte, do registro até a solução, o que dá mais transparência à relação entre cidadão e poder público.

O projeto é desenvolvido com o envolvimento da turma de **Análise e Desenvolvimento de Sistemas (ADS)**, que participa da construção do aplicativo como atividade prática do curso.

## Funcionalidades

- Login com e-mail e senha e com conta Google (via Firebase Authentication)
- Navegação sem login, para consultar o mapa e a tela inicial
- Mapa com os problemas reportados
- Criação e listagem de reportes de problemas na cidade
- Perfil do usuário
- Alteração de status dos reportes por administradores

## Tecnologias

- [Expo](https://expo.dev) SDK 58 + [Expo Router](https://docs.expo.dev/router/introduction/) (rotas baseadas em arquivos)
- React Native + TypeScript
- [Firebase](https://firebase.google.com/) (Authentication e Cloud Firestore)
- `expo-auth-session` para o login com Google

## Pré-requisitos

- [Node.js](https://nodejs.org/) LTS (20 ou superior)
- npm
- Um projeto no [Firebase](https://console.firebase.google.com/) com *Authentication* (Google e/ou e-mail e senha) e **Cloud Firestore** habilitados
- Um **OAuth Client ID (Web)** criado no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Para rodar no celular: o app [Expo Go](https://expo.dev/go) ou um emulador Android/iOS

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   git clone <url-do-repositorio>
   cd Projeto_falaa_cidade
   npm install
   ```

2. Crie o arquivo `.env` na raiz do projeto a partir do exemplo:

   ```bash
   cp .envExample .env
   ```

3. Preencha o `.env` com as credenciais do seu projeto Firebase e do Google:

   | Variável | Onde encontrar |
   | --- | --- |
   | `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Cloud Console → APIs e serviços → Credenciais |

   > O `.env` está no `.gitignore`. Nunca faça commit das suas credenciais.

4. No Google Cloud Console, cadastre a *redirect URI* usada pelo app em **Authorized redirect URIs** e **Authorized JavaScript origins**.

## Como rodar

```bash
npm start          # inicia o servidor do Expo
npm run android    # abre no emulador/dispositivo Android
npm run ios        # abre no simulador iOS (somente macOS)
npm run web        # abre no navegador
```

Com o servidor rodando, escaneie o QR Code com o **Expo Go** para abrir no celular.

## Scripts úteis

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o Expo |
| `npm run lint` | Roda o ESLint |
| `npx tsc --noEmit` | Verifica os tipos do TypeScript |

## Estrutura do projeto

```
app/                 # Telas e rotas (Expo Router)
  index.tsx          # Login (rota inicial)
  (tabs)/            # Navegação por abas (mapa, perfil etc.)
  novo-reporte.tsx   # Criação de reporte
  lista-de-reportes.tsx # Lista de reportes
components/          # Componentes reutilizáveis
context/             # Contextos React (autenticação e localização)
hooks/               # Hooks customizados (login, localização, ocorrências, admin)
services/            # Acesso ao Firestore (reportes, ocorrências, administradores)
constants/           # Cores, temas e constantes
assets/              # Imagens e fontes
docs/                # Documentação e anotações do projeto
firebase-config.ts   # Inicialização do Firebase
firestore.rules      # Regras de segurança do Firestore
```

## Fluxo de trabalho (Git)

- A branch principal é a `main`.
- Crie uma branch para cada tarefa: `feature/...`, `fix/...` ou `chore/...`.
- Abra um Pull Request para a `main` quando a tarefa estiver pronta.

## Documentação adicional

- Versão atual: Expo SDK 58 (conforme `package.json`)
- [Atualização para o Expo SDK 57 (registro histórico)](docs/atualizacao-expo-sdk-57.md)
- [Documentação do Expo](https://docs.expo.dev/)
# Projeto_falaa_cidade
# Projeto_falaa_cidade
# Projeto_falaa_cidade
# Projeto_falaa_cidade
# Projeto_falaa_cidade
