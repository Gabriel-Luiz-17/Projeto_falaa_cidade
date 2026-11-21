# Relatório — Desafios 1 e 2 (Falaa Cidade)

Este documento descreve o que está implementado e testado no projeto atualmente, após os últimos ajustes de documentação para entrega. Nenhuma alteração foi enviada ao GitHub e nenhuma publicação foi feita no Firebase nesta etapa; as regras do Firestore e o cadastro da conta administradora já estavam prontos no Console, conforme confirmado pelo usuário.

## 1. Visão geral das funcionalidades implementadas

### 1.1 Autenticação de usuários

O app usa **Firebase Authentication** e mantém o usuário logado em um contexto global:

- `firebase-config.ts`: inicializa o Firebase, cria o `auth` e o Firestore (`bancoDeDados`). No Android/iOS a sessão é persistida com `AsyncStorage`; na web é usada a persistência padrão do Firebase.
- `context/auth-context.tsx`: `AuthProvider` escuta `onAuthStateChanged`, guarda `user` e expõe `signOut()`; o logout é aguardado antes de navegar.
- Login disponível:
  - **E-mail e senha** em `app/index.tsx` (`signInWithEmailAndPassword`), com cadastro em `app/cadastro.tsx`, verificação de e-mail em `app/verificar-email.tsx` e recuperação de senha em `app/esqueci-senha.tsx`.
  - **Google** em `hooks/use-google-auth.ts`: o `id_token` do Google é trocado por uma credencial do Firebase com `signInWithCredential`.
- `app/_layout.tsx` envolve o app com `AuthProvider` e `CidadeProvider`.
- Usuários já autenticados são redirecionados para `/mapa` quando o e-mail está verificado, ou para `/verificar-email` quando não está.

### 1.2 Criação e armazenamento de reportes no Firestore

- A tela `app/novo-reporte.tsx` é o formulário de envio: título obrigatório, descrição opcional, tipo (`Buraco`, `Calçada`, `Iluminação`, `Outro`), validação de login e coordenadas, indicador de carregamento, bloqueio contra envio duplicado e alertas de sucesso/erro.
- `Location.reverseGeocodeAsync` tenta preencher o endereço aproximado; se falhar, o envio continua.
- O serviço `services/reportes.ts` grava na coleção **`ocorrencias`** do Cloud Firestore com `setDoc`. O ID é reservado antes da gravação por `gerarIdReporte()` (SDK do Firestore) e enviado junto com os dados.
- `criadoEm` é gravado com `serverTimestamp()` (hora do servidor).

Campos gravados em `ocorrencias/{id}`:

| Campo | Conteúdo |
| --- | --- |
| `idNotificante` | UID do usuário autenticado |
| `titulo` | Título do reporte, com `trim` |
| `descricao` | Descrição com `trim` ou `null` se vazia |
| `status` | Sempre `"aberto"` na criação |
| `latitude` / `longitude` | Coordenadas do local |
| `tipo` | Tipo escolhido no formulário |
| `endereco` | Endereço aproximado ou `null` |
| `criadoEm` | Timestamp gerado pelo servidor |

### 1.3 Listagem dos reportes

- `services/ocorrencias.ts` consulta `ocorrencias` com `orderBy("criadoEm", "desc")` e `limit(50)`, usando `getDocs`, e converte cada documento em `Ocorrencia` preservando o ID real.
- `hooks/use-ocorrencias.ts` recarrega os dados quando a tela ganha foco (`useFocusEffect`), expõe `recarregar()` para atualização manual e controla carregamento/erros sem atualizar componente desmontado.
- `app/lista-de-reportes.tsx` exibe os itens em `FlatList` com título, descrição, tipo, endereço, status (cor e rótulo de `constants/status.ts`), data de criação, contador, estado vazio, `RefreshControl` e filtro “Todos / Meus reportes”. O filtro é apenas local e não interfere no mapa.
- A lista é acessível pelos links de Perfil, Notificações e Ranking e pela rota `/lista-de-reportes` registrada em `app/_layout.tsx`.

**Sobre a localização (GPS):** a consulta em `services/ocorrencias.ts` não depende de coordenadas — o parâmetro `_centro` existe apenas para compatibilidade e não é usado na query. Quem condiciona a busca é `hooks/use-ocorrencias.ts`: se `coordenadas` for `null`, o hook limpa a lista e não chama o serviço. Como `context/cidade-context.tsx` só preenche `coordenadas` quando a permissão de localização é concedida e `getCurrentPositionAsync` obtém a posição, negar o GPS deixa a lista e o mapa sem reportes. Portanto, isso é uma **decisão de implementação do hook** (o mapa também precisa das coordenadas para centralizar a região), não uma exigência do Firestore nem uma regra de segurança.

### 1.4 Exibição dos reportes no mapa

- `app/(tabs)/mapa.tsx` usa o mesmo `useOcorrencias(coordenadas)` da lista, mantendo os filtros de busca e status já existentes.
- `components/mapa-view.tsx` renderiza um `Marker` por ocorrência, com coordenadas, título e rótulo/cor do status (`constants/status.ts`): `aberto` (vermelho), `em_execucao` (âmbar) e `resolvido` (verde).
- Na web, `components/mapa-view.web.tsx` informa que o mapa está disponível no app Android/iOS.

### 1.5 Cadastro e identificação de administradores pela coleção `admins`

- Não existe tela no app para cadastrar administradores. O cadastro é feito manualmente no **Firebase Console**, conforme o guia `CONFIGURACAO_FIREBASE.md`: o documento tem como ID o UID do usuário e o formato `admins/{UID_DO_ADMIN}` com o campo `role: "admin"`. Conforme confirmado pelo usuário, a conta administradora já foi cadastrada nessa coleção.
- `services/administradores.ts` implementa `verificarAdministrador(uid)`: se não houver UID, retorna `false`; caso contrário, lê `admins/{uid}` e retorna `true` somente se o documento existir e `role === "admin"`.
- `hooks/use-admin.ts` chama esse serviço para o usuário atual e devolve `ehAdmin`, `verificando` e `erro`. Se a consulta falhar ou o usuário não estiver logado, o resultado é `ehAdmin = false` (comportamento seguro: não concede permissão por falha).
- A tela de reportes mostra “Verificando permissões...” ou um aviso quando não consegue verificar a permissão.

### 1.6 Controle de permissões de administrador

- **Na interface:** o botão “Alterar status” só aparece quando `ehAdmin` é `true`; `abrirOpcoesStatus` também possui um guarda `if (!ehAdmin) return;`. Esse controle é apenas visual e não é uma barreira de segurança.
- **No servidor:** as regras do Firestore são a autoridade. A regra de `update` exige usuário autenticado, documento `admins/{uid}` com `role == "admin"`, alteração apenas do campo `status` e valor de status válido.
- Usuários comuns podem ler os reportes e criar os seus próprios, mas **não podem alterar o status** nem qualquer outro campo de um reporte existente, e não podem excluir reportes. Eles também não podem criar, editar ou excluir documentos em `admins`, e só podem ler o próprio documento dessa coleção.
- Mesmo um administrador não pode mudar título, descrição, coordenadas etc. pelo app: as regras aceitam somente alterações em `status`.

### 1.7 Alteração de status dos reportes

- Os status possíveis são `aberto`, `em_execucao` e `resolvido`, definidos em `types/ocorrencia.ts` e em `constants/status.ts`.
- Em `app/lista-de-reportes.tsx`, o administrador toca em “Alterar status” e escolhe uma das três opções. `alterarStatus` chama `atualizarStatusReporte(id, status)`, atualiza o item localmente com `aplicarStatusLocalmente` e exibe confirmação; em caso de falha, registra o erro no console e avisa sobre a permissão.
- `services/reportes.ts` valida se o status está em `OPCOES_STATUS` antes de chamar `updateDoc`. **Somente administradores podem concluir a alteração**: se um usuário comum tentar a gravação, o Firestore nega a operação pelas regras descritas abaixo.

## 2. Regras de segurança do Firestore

Arquivo local: `firestore.rules` (o `firebase.json` aponta somente para ele). Conteúdo atual:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function estaAutenticado() {
      return request.auth != null;
    }

    // Um administrador é identificado pelo documento admins/{uid} com role "admin".
    function ehAdmin() {
      return estaAutenticado()
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid))
        && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    function statusValido(status) {
      return status in ['aberto', 'em_execucao', 'resolvido'];
    }

    match /ocorrencias/{idOcorrencia} {
      allow read: if true;
      allow create: if estaAutenticado()
        && request.resource.data.idNotificante == request.auth.uid
        && request.resource.data.status == 'aberto';
      // Mesmo o admin só pode alterar o status, e apenas para um valor válido.
      allow update: if estaAutenticado()
        && ehAdmin()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
        && statusValido(request.resource.data.status);
      allow delete: if false;
    }

    match /admins/{uid} {
      // Cada usuário lê só o próprio documento de admin; o cadastro é feito no Console.
      allow get: if estaAutenticado() && request.auth.uid == uid;
      allow create, update, delete: if false;
    }
  }
}
```

Interpretação:

- `allow read: if true` mantém a leitura pública dos reportes, necessária para mapa e lista.
- `allow create` exige login, `idNotificante` igual ao UID autenticado e status inicial `aberto`; assim ninguém cria um reporte em nome de outra pessoa nem já o cria como resolvido.
- `allow update` só aceita administradores e apenas o campo `status`, dentro da lista permitida. É essa regra que impede usuários comuns de alterarem status, independentemente do que a interface mostra.
- `allow delete: if false` e as restrições em `admins` fecham o acesso de escrita.

Conforme confirmado pelo usuário, essas regras **já foram publicadas no Firebase Console** e a conta administradora já está cadastrada em `admins`. Nenhuma regra local ou publicada foi alterada nesta etapa e não foi feito deploy.

## 3. Testes e verificações

### 3.1 Verificações de TypeScript e lint

| Comando | Resultado |
| --- | --- |
| `npx tsc --noEmit` | Passou, sem erros (revisão anterior) |
| `npx expo lint` | Passou, sem erros (revisão anterior) |

Nesta etapa final apenas arquivos de documentação foram alterados, não havendo nova verificação de código.

### 3.2 Verificações já registradas no repositório

O arquivo `docs/atualizacao-expo-sdk-57.md` registra, para a atualização de SDK realizada anteriormente: `npx tsc --noEmit` sem erros, `npm run lint` sem erros, `npx expo-doctor` com 21/21 verificações OK e `npx expo export --platform ios --platform android` com bundles gerados. É um registro histórico de código/build, distinto dos testes no celular listados abaixo.

### 3.3 Testes realizados em celular Android

Conforme confirmado pelo usuário, o aplicativo foi testado em um **celular Android**, com os seguintes resultados:

- **Autenticação:** funcionando.
- **Mapa:** funcionando, com os reportes exibidos.
- **Criação de reportes:** funcionando.
- **Listagem de reportes:** funcionando.
- **Alteração de status por administrador:** testada e funcionando.

Tratam-se de testes realizados no dispositivo e relatados pelo usuário. Este documento **não registra testes automatizados** nem apresenta resultados de suítes automáticas; o projeto não inclui esse tipo de verificação. O guia `CONFIGURACAO_FIREBASE.md` permanece como roteiro de referência para repetir os testes de administrador e de usuário comum.

### 3.4 Abrangência das verificações

- Regras do Firestore publicadas no Console e conta administradora cadastrada em `admins`: confirmado pelo usuário.
- Tipagem e lint: aprovados na revisão anterior.
- Testes automatizados: não documentados neste relatório.
- Nenhuma publicação ou deploy foi realizado nesta etapa de ajustes documentais.

## 4. Configuração do Firebase e funcionalidade de fotos

- `firebase-config.ts` usa apenas as variáveis `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` e `EXPO_PUBLIC_FIREBASE_APP_ID`, além de `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no hook do Google. Isso é coerente com o uso atual: Authentication + Firestore.
- Não existe código de Firebase Storage nesta revisão: não há imports de `firebase/storage`, `uploadBytes`, `getDownloadURL`, `expo-image-picker` nem câmera; o campo `fotos` não existe nos reportes. A funcionalidade de fotos foi abandonada por depender do Storage com plano pago.
- A variável `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, que sobrou dos modelos de ambiente, foi removida de `.env.example` e `.envExample` na revisão anterior porque não é lida pelo código. O `.env` local não foi alterado.
- `expo-image` e `AsyncStorage` continuam no projeto, mas para usos diferentes de fotos de reporte: exibição da foto de perfil da conta Google e persistência da sessão do Firebase Auth, respectivamente.
- Pacotes `@firebase/storage*` podem aparecer apenas como dependências transitivas do SDK do Firebase no `package-lock.json`; não são usados pelo app.

## 5. Situação para a entrega

1. Regras do Firestore publicadas no Console: confirmado pelo usuário; não foram alteradas nesta etapa.
2. Conta administradora cadastrada em `admins` com `role: "admin"`: confirmado pelo usuário, com teste de alteração de status concluído com sucesso.
3. Manter as credenciais locais em `.env` e não compartilhar seus valores.
4. Para usar lista e mapa, o usuário precisa permitir a localização no dispositivo. Sem coordenadas, `useOcorrencias` limpa a lista e não consulta o Firestore; isso é uma decisão de implementação do hook, não uma limitação do banco nem das regras.
5. `README.md` e `AGENTS.md` tiveram as informações comprovadamente desatualizadas corrigidas com base em `package.json`: Expo SDK 58, Firebase com Firestore, telas atuais e alteração de status como funcionalidade concluída. `docs/atualizacao-expo-sdk-57.md` permanece como registro histórico da atualização anterior.

Não há pendência funcional para a entrega.

## 6. Checklist final

### Autenticação
- [x] Firebase Auth inicializado com persistência no app
- [x] Login com e-mail/senha e com Google
- [x] Cadastro, verificação de e-mail e recuperação de senha
- [x] Contexto global do usuário e logout

### Reportes
- [x] Firestore configurado (`bancoDeDados`)
- [x] Serviço `services/reportes.ts` com `setDoc` e ID gerado pelo SDK
- [x] Título obrigatório e descrição opcional
- [x] UID do notificante, status inicial `aberto`, coordenadas e tipo
- [x] Data do servidor com `serverTimestamp()`
- [x] Endereço aproximado quando disponível
- [x] Tratamento de erros e indicador de carregamento

### Lista e mapa
- [x] Leitura real do Firestore, sem MOCK
- [x] Ordenação por `criadoEm` decrescente e limite de 50
- [x] Recarga ao ganhar foco e pull-to-refresh
- [x] Lista com status, cor, data, total e filtro local
- [x] Marcadores reais no mapa com cores de status

### Administração e status
- [x] Identificação por `admins/{uid}` com `role: "admin"`
- [x] Verificação no cliente com tratamento seguro de falha
- [x] Botão de alterar status apenas para administradores
- [x] Status `aberto`, `em_execucao` e `resolvido`
- [x] Atualização local após sucesso e mensagens ao usuário
- [x] Regras do Firestore exigindo administrador e apenas o campo `status`

### Qualidade
- [x] Logs temporários de depuração removidos
- [x] Comentários explicativos sobre verificação de admin, alteração de status e regras
- [x] Nenhuma referência de código a fotos/Storage do Firebase
- [x] `npx tsc --noEmit` passou
- [x] `npx expo lint` passou
- [x] Regras publicadas no Firebase Console e conta administradora cadastrada em `admins`
- [x] Teste funcional em celular Android: autenticação, mapa, criação e listagem de reportes e alteração de status por administrador
- [x] Documentação de versão alinhada ao `package.json` (Expo SDK 58)
