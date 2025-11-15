# Configuração Android - Google OAuth

## Problema: Login Google não retorna ao app

O login com Google abre o navegador mas não retorna ao app porque falta configurar o **Deep Link** no Android.

## Solução: Configurar Deep Link

1. **Abra o arquivo `android/app/src/main/AndroidManifest.xml`**

2. **Adicione dentro da tag `<activity>` principal:**

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4" />
</intent-filter>
```

3. **O arquivo completo deve ficar assim:**

```xml
<activity
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:name=".MainActivity"
    android:label="@string/title_activity_main"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:launchMode="singleTask"
    android:exported="true">

    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>

    <!-- ADICIONE ESTE BLOCO -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4" />
    </intent-filter>

</activity>
```

4. **Configure no Supabase (Lovable Cloud):**
   - Entre no backend do Lovable
   - Vá em Users → Auth Settings → Google Settings
   - Adicione a URL de redirect: `app.lovable.f42c690ddbcc4ae6804fb01c1b9394b4://callback`

5. **Rebuild o app:**
```bash
npx cap sync android
npx cap run android
```

## Problema: Dados não aparecem / Nomes duplicados

Isso acontece porque o app está salvando dados apenas no **localStorage** do dispositivo, não no **Supabase**.

### Solução:

1. **Sempre use o mesmo email** tanto no PWA quanto no APK
2. **Os dados precisam estar no Supabase**, não só no localStorage
3. **Verifique se está logado** - sem login, os dados ficam apenas locais

### Como migrar dados existentes:

Se já tem dados no PWA que não aparecem no APK:

1. Abra o PWA no navegador
2. Entre com a mesma conta Google
3. Clique no ícone de sincronização no canto superior direito
4. Aguarde sincronizar
5. Agora abra o APK com a mesma conta - os dados devem aparecer

### Evitar duplicados:

- **Sempre sincronize** antes de fechar o app
- Use o **mesmo email** em todos os dispositivos
- Os dados são salvos por usuário no Supabase

## Teste final:

1. Desinstale o app atual
2. Faça o rebuild com as configurações acima
3. Instale e faça login com Google
4. Adicione uma rota/criança
5. Verifique se aparece tanto no PWA quanto no APK
