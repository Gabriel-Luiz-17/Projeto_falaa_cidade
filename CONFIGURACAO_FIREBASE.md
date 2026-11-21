# Configuração manual no Firebase Console

Este guia descreve apenas o que precisa ser feito manualmente no Firebase para cadastrar administradores e permitir a alteração de status dos reportes. Nenhuma credencial privada, arquivo `.env` ou segredo foi alterado pelo código.

O aplicativo usa Firebase Authentication para o login e Firestore para gravar e listar os reportes. Não há mais envio, armazenamento ou exibição de fotos nos reportes, portanto não existe configuração de Firebase Storage neste documento.

## 1. Publicar as regras do Firestore

As regras estão no arquivo `firestore.rules`. Elas verificam a coleção `admins` e permitem que somente administradores alterem o campo `status` de um reporte, mantendo os demais campos protegidos.

### Pelo Firebase Console

1. No menu lateral, abra **Build > Firestore Database**.
2. Clique na aba **Rules**.
3. Copie todo o conteúdo de `firestore.rules` para o editor.
4. Clique em **Publish**.

### Pelo Firebase CLI (opcional)

O arquivo `firebase.json` aponta apenas para `firestore.rules`.

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Use o mesmo projeto já utilizado pelo aplicativo e confira o projeto selecionado antes de publicar.

## 2. Encontrar o UID de um usuário

1. No Firebase Console, abra **Build > Authentication**.
2. Clique na aba **Users**.
3. Localize o usuário que deve ser administrador.
4. Copie o valor da coluna **User UID**.

O UID será usado como ID do documento na coleção `admins`.

## 3. Cadastrar o administrador na coleção `admins`

1. Acesse **Build > Firestore Database > Data**.
2. Clique em **Start collection** (ou selecione a coleção `admins`, se ela já existir).
3. Use `admins` como nome da coleção.
4. Clique em **Add document**.
5. No campo **Document ID**, cole exatamente o UID copiado no passo anterior.
6. Adicione um campo:
   - campo: `role`
   - tipo: `string`
   - valor: `admin`
7. Salve o documento.

O documento deve ficar assim:

```text
admins/{UID_DO_ADMIN}
{ "role": "admin" }
```

Somente usuários com esse documento são considerados administradores. Não adicione outros usuários a essa coleção sem confirmar a permissão.

## 4. Testar a alteração de status como administrador

1. Entre no aplicativo com o usuário cadastrado como administrador.
2. Abra a tela **Reportes**.
3. Confirme que o botão **Alterar status** aparece nos cartões.
4. Toque em **Alterar status**.
5. Escolha `Aberto`, `Em execução` ou `Resolvido`.
6. Confirme a mensagem de sucesso e que o status do cartão muda sem recarregar a tela.
7. No Firestore, abra `ocorrencias/{ID_DO_REPORTE}` e confirme que somente o campo `status` foi alterado.

## 5. Testar que um usuário comum não altera o status

1. Entre no aplicativo com um usuário que **não** tenha documento em `admins`.
2. Abra **Reportes** e confirme que o botão **Alterar status** não aparece.
3. Mesmo que o botão esteja escondido, as regras do Firestore também bloqueiam a operação. Teste isso por uma destas formas:
   - no Firebase Console, abra **Firestore Database > Rules > Rules playground**, simule uma atualização em `/ocorrencias/{ID}` com o contexto autenticado do usuário comum e altere apenas `status`; a operação deve ser negada;
   - ou, em uma sessão autenticada como usuário comum no aplicativo, tente uma atualização direta via SDK do Firebase; a resposta deve ser `permission-denied`.
4. Também tente alterar `status` para um valor fora de `aberto`, `em_execucao` e `resolvido` com um administrador; deve ser negado pelas regras.
5. Tente criar, editar ou excluir documentos em `admins` a partir do SDK de um usuário comum; deve ser negado.
6. Com usuário comum, tente atualizar um reporte já publicado alterando `descricao`, `titulo` ou outro campo; deve ser negado pelas regras.

Atenção: alterações feitas diretamente pelo Console do Firebase com credenciais de administrador do projeto não representam o teste das regras, pois o Console usa privilégios de administrador e ignora essas regras.
