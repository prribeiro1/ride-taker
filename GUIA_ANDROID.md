# 🚀 Guia Completo - APK Android

## 📋 Problemas a Resolver

1. ❌ **Login Google abre navegador e não volta para o app**
2. ❌ **Dados do PWA não aparecem no APK**
3. ❌ **Nomes duplicados**

---

## 🔧 PARTE 1: Configurar Deep Link (Resolver problema do login)

### Passo 1: Abrir o Android Studio
1. Abra o Android Studio
2. Abra o projeto na pasta `android` do seu projeto
3. Aguarde o Gradle sincronizar

### Passo 2: Editar o AndroidManifest.xml
1. No Android Studio, navegue até: `android/app/src/main/AndroidManifest.xml`
2. Procure pela tag `<activity>` que tem `android:name=".MainActivity"`
3. **DENTRO** dessa tag `<activity>`, adicione o código abaixo:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4" />
</intent-filter>
```

### Passo 3: Exemplo de como deve ficar

O arquivo completo deve ter esta estrutura:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        ...>
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <!-- Intent filter original -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- 👇 ADICIONE ESTE BLOCO AQUI 👇 -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4" />
            </intent-filter>
            <!-- 👆 ATÉ AQUI 👆 -->

        </activity>

    </application>

</manifest>
```

### Passo 4: Salvar o arquivo
Salve o arquivo (`Ctrl+S` ou `Cmd+S`)

---

## ☁️ PARTE 2: Configurar Supabase (Lovable Cloud)

### Passo 1: Acessar o Backend
1. No Lovable, clique em "View Backend" (ou use o botão que vou fornecer abaixo)
2. Você será direcionado para o painel do Lovable Cloud

### Passo 2: Configurar URL de Redirect do Google
1. No menu lateral, procure por **"Users"** ou **"Auth Settings"**
2. Clique em **"Auth Settings"**
3. Procure por **"Google Settings"** ou **"External Providers"**
4. Adicione esta URL na lista de **Redirect URLs**:
   ```
   app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4://callback
   ```

### Passo 3: Verificar Site URL
Certifique-se de que a **Site URL** também está configurada:
- Produção: `https://f42c690d-dbcc-4ae6-804f-b01c1b9394b4.lovableproject.com`
- OU seu domínio customizado (se tiver)

### Passo 4: Salvar
Clique em **"Save"** ou **"Salvar"**

---

## 📱 PARTE 3: Rebuild do App

### Passo 1: Abrir Terminal
No VS Code ou no terminal do seu sistema, navegue até a pasta do projeto

### Passo 2: Sincronizar Capacitor
Execute:
```bash
npx cap sync android
```

Aguarde finalizar (pode demorar 1-2 minutos)

### Passo 3: Abrir no Android Studio
```bash
npx cap open android
```

### Passo 4: Gerar novo APK
1. No Android Studio, clique em **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Aguarde a compilação terminar
3. Clique em **"locate"** quando aparecer a notificação
4. O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔄 PARTE 4: Resolver Dados Duplicados/Faltantes

### Por que isso acontece?
- O PWA salva dados no **localStorage do navegador**
- O APK salva dados no **localStorage do app**
- São dois lugares diferentes!
- Os dados precisam estar **no Supabase** para aparecer em ambos

### Solução:

#### Passo 1: Sincronizar dados do PWA
1. Abra o PWA no navegador
2. Faça login com a **mesma conta Google** que usa no APK
3. Procure o **ícone de sincronização** no canto superior direito (pode ser um ícone de nuvem ou setas circulares)
4. Clique nele e aguarde sincronizar
5. Deve aparecer uma mensagem de "Sincronização concluída"

#### Passo 2: Limpar dados locais do APK
1. No celular Android, vá em **Configurações**
2. **Apps** → Procure por **"Monitor Transporte Escolar"**
3. **Armazenamento** → **Limpar dados** (NÃO limpar cache, limpar DADOS)
4. Confirme

#### Passo 3: Reinstalar o novo APK
1. Desinstale o app antigo
2. Instale o novo APK que você gerou no Passo 3
3. Faça login com Google
4. Após o login, clique no ícone de sincronização
5. Os dados devem aparecer!

---

## ✅ Como Evitar Problemas no Futuro

### Regra de Ouro:
**SEMPRE sincronize antes de fechar o app!**

### Boas Práticas:
1. ✅ Use sempre a **mesma conta** no PWA e no APK
2. ✅ Clique em **sincronizar** depois de adicionar/editar dados
3. ✅ Aguarde a mensagem de "Sincronização concluída"
4. ✅ Se trocar de dispositivo, faça login e sincronize primeiro

### O que NÃO fazer:
1. ❌ Não use contas diferentes no PWA e no APK
2. ❌ Não adicione dados sem estar logado
3. ❌ Não feche o app sem sincronizar

---

## 🧪 TESTE FINAL

### Passo a Passo do Teste:

1. **Desinstale o app antigo** do celular
2. **Instale o novo APK** que você acabou de gerar
3. **Abra o app**
4. **Clique em "Entrar com Google"**
5. **Escolha sua conta** → Deve voltar automaticamente para o app! ✅
6. **Adicione uma nova rota** chamada "TESTE"
7. **Clique no ícone de sincronização** e aguarde
8. **Abra o PWA no navegador** com a mesma conta
9. **A rota "TESTE" deve aparecer!** ✅

Se tudo funcionar: **Sucesso!** 🎉

---

## 🆘 Se Ainda Não Funcionar

### Problema: Login ainda abre navegador e não volta

**Verificar:**
1. O `intent-filter` está **dentro** da tag `<activity>`?
2. Você salvou o arquivo `AndroidManifest.xml`?
3. Você executou `npx cap sync android`?
4. Você gerou um **novo APK**? (não use o antigo!)

### Problema: Dados não aparecem

**Verificar:**
1. Está logado com a **mesma conta** no PWA e no APK?
2. Clicou no botão de **sincronização**?
3. Aguardou a mensagem de "Sincronização concluída"?
4. Tem **conexão com internet**?

### Problema: Erro ao fazer login

**Verificar:**
1. A URL de redirect está correta no Lovable Cloud?
   - `app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4://callback`
2. O Google OAuth está configurado no Lovable Cloud?

---

## 📞 Precisa de Ajuda?

Se ainda tiver problemas, me envie:
1. Screenshot da tela de erro (se houver)
2. Em que passo você está
3. O que acontece quando você tenta fazer login

---

**Boa sorte!** 🚀
