# 📋 Configuração de Ambientes - Site Gazeta

## 🎯 Estrutura de Arquivos `.env`

### **Desenvolvimento (Local - Windows)**

```
C:\workspace\site-gazeta\
  │
  ├── .env                           ← Desenvolvimento LOCAL
  │   DATABASE_URL="mysql://root:senha@localhost:3306/gazeta_db"
  │   JWT_SECRET="seu-secret-local"
  │   NODE_ENV=development
  │
  └── .env.production               ← Config de PRODUÇÃO (para build)
      DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"
      JWT_SECRET="SADLSNHLAK@GAKJSLAKsajhj2@63151238798|:?>?ç"
      NODE_ENV=production
```

---

### **Produção (Servidor Linux)**

```
/home/gazetadopara.com/public_html/site-gazeta/
  │
  ├── .env                           ← PRINCIPAL (OBRIGATÓRIO)
  │   DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"
  │   JWT_SECRET="SADLSNHLAK@GAKJSLAKsajhj2@63151238798|:?>?ç"
  │   NODE_ENV=production
  │
  └── apps/backend-gazeta/
      └── .env.production           ← BACKUP (recomendado)
          DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"
          JWT_SECRET="SADLSNHLAK@GAKJSLAKsajhj2@63151238798|:?>?ç"
          NODE_ENV=production
```

---

## 🔐 Variáveis de Ambiente

### **DATABASE_URL**

**Formato:**
```bash
mysql://USUARIO:SENHA@HOST:PORTA/NOME_BANCO
```

**⚠️ IMPORTANTE: Caracteres Especiais na Senha**

Se a senha contém caracteres especiais (`@`, `#`, `%`, `:`, `/`, etc.), você **DEVE** fazer URL encoding:

| Caractere | Codificado | Exemplo                |
|-----------|------------|------------------------|
| `@`       | `%40`      | `senha@123` → `senha%40123` |
| `#`       | `%23`      | `senha#123` → `senha%23123` |
| `%`       | `%25`      | `senha%123` → `senha%25123` |
| `:`       | `%3A`      | `senha:123` → `senha%3A123` |
| `/`       | `%2F`      | `senha/123` → `senha%2F123` |

**Exemplos:**

```bash
# ✅ CORRETO - Senha: gaze_sitenovo@12
DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"

# ❌ ERRADO - Vai quebrar por causa do @
DATABASE_URL="mysql://gaze_novo:gaze_sitenovo@12@127.0.0.1:3306/gaze_sitenovo"
```

---

### **JWT_SECRET**

String aleatória e complexa para assinar tokens JWT.

**✅ CORRETO:**
```bash
JWT_SECRET="SADLSNHLAK@GAKJSLAKsajhj2@63151238798|:?>?ç"
```

**📝 Observação:** JWT_SECRET pode ter **qualquer caractere**, não precisa de encoding!

---

### **NODE_ENV**

```bash
NODE_ENV=production   # Produção
NODE_ENV=development  # Desenvolvimento
```

---

## 🚀 Processo de Deploy

### **1️⃣ Na Sua Máquina (Windows)**

```powershell
# Navegar para o projeto
cd C:\workspace\site-gazeta

# Gerar Prisma Client com binários para Windows E Linux
cd apps\backend-gazeta
npx prisma generate

# Voltar para raiz e fazer build
cd ..\..
npx nx build backend-gazeta --prod

# Verificar se os binários foram gerados
ls apps\backend-gazeta\generated\prisma\*.node
# Deve mostrar:
# - libquery_engine-debian-openssl-1.1.x.so.node (Linux)
# - query_engine-windows.dll.node (Windows)
```

---

### **2️⃣ Upload via FTP/SFTP**

**Arquivos que DEVEM ser enviados:**

```
LOCAL                                              REMOTO
──────────────────────────────────────────────────────────────────────────────
C:\workspace\site-gazeta\dist\                 →  /home/.../site-gazeta/dist/

C:\workspace\site-gazeta\apps\                 →  /home/.../site-gazeta/apps/
  backend-gazeta\generated\                         backend-gazeta/generated/
```

**⚠️ NÃO ENVIAR:**
- ❌ `.env` (cada ambiente tem seu próprio)
- ❌ `.env.production` (será configurado no servidor)
- ❌ `node_modules/` (já está no servidor)

---

### **3️⃣ No Servidor (SSH)**

```bash
# Navegar para o projeto
cd /home/gazetadopara.com/public_html/site-gazeta

# Criar/atualizar .env na RAIZ (OBRIGATÓRIO)
cat > .env << 'EOF'
DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"
JWT_SECRET="SADLSNHLAK@GAKJSLAKsajhj2@63151238798|:?>?ç"
NODE_ENV=production
EOF

# Também criar no backend como backup
cp .env apps/backend-gazeta/.env.production

# Copiar binários do Prisma para onde o build procura
mkdir -p generated/prisma
cp -r apps/backend-gazeta/generated/prisma/* generated/prisma/

# Verificar se os binários foram copiados
ls -lh generated/prisma/*.node
# Deve mostrar: libquery_engine-debian-openssl-1.1.x.so.node

# Reiniciar o backend
pm2 restart backend-gazeta

# Verificar logs
pm2 logs backend-gazeta --lines 30
```

---

## ✅ Checklist de Deploy

### **Antes do Deploy:**

```
[ ] Build local feito com npx nx build backend-gazeta --prod
[ ] Prisma gerado com npx prisma generate
[ ] Binários Prisma incluem versão Linux (.so.node)
[ ] Arquivo .env.production local tem credenciais de produção
```

### **Durante o Upload:**

```
[ ] Pasta dist/ enviada
[ ] Pasta apps/backend-gazeta/generated/ enviada
[ ] Binários .so.node verificados no servidor
```

### **Após o Upload:**

```
[ ] Arquivo .env criado na RAIZ do projeto
[ ] Variáveis DATABASE_URL, JWT_SECRET, NODE_ENV configuradas
[ ] Binários copiados para generated/prisma/
[ ] PM2 reiniciado
[ ] Logs verificados (sem erro de Prisma)
[ ] API respondendo em https://gazetadopara.com/api
```

---

## 🔍 Troubleshooting

### **Erro: "Environment variable not found: DATABASE_URL"**

**Causa:** Arquivo `.env` não existe ou está vazio.

**Solução:**
```bash
cd /home/gazetadopara.com/public_html/site-gazeta
cat > .env << 'EOF'
DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"
JWT_SECRET="SADLSNHLAK@GAKJSLAKsajhj2@63151238798|:?>?ç"
NODE_ENV=production
EOF
pm2 restart backend-gazeta
```

---

### **Erro: "Prisma Client could not locate the Query Engine"**

**Causa:** Binários do Prisma não foram enviados ou estão no local errado.

**Solução 1 - Copiar binários:**
```bash
cd /home/gazetadopara.com/public_html/site-gazeta
mkdir -p generated/prisma
cp -r apps/backend-gazeta/generated/prisma/* generated/prisma/
pm2 restart backend-gazeta
```

**Solução 2 - Gerar no servidor:**
```bash
cd /home/gazetadopara.com/public_html/site-gazeta/apps/backend-gazeta
npx prisma generate
cd ../..
mkdir -p generated/prisma
cp -r apps/backend-gazeta/generated/prisma/* generated/prisma/
pm2 restart backend-gazeta
```

---

### **Erro: "Authentication failed against database server"**

**Causa:** Credenciais do banco incorretas ou senha com caracteres especiais não codificados.

**Solução:**
```bash
# Verificar senha
# Se senha tem @: gaze_sitenovo@12
# Use: gaze_sitenovo%4012

# Corrigir .env
nano .env
# Alterar para: DATABASE_URL="mysql://gaze_novo:gaze_sitenovo%4012@127.0.0.1:3306/gaze_sitenovo"

pm2 restart backend-gazeta
```

---

### **Erro: Backend crashando constantemente (↺ aumentando)**

**Causa:** Algum erro crítico no código ou configuração.

**Diagnóstico:**
```bash
# Ver logs de erro
pm2 logs backend-gazeta --err --lines 50

# Ver todas as tentativas de restart
pm2 status
```

**Solução Comum:**
1. Verificar `.env` está correto
2. Verificar binários do Prisma existem
3. Verificar permissões dos arquivos
4. Limpar cache e rebuildar se necessário

---

## 📊 Verificação de Sucesso

### **PM2 Status:**

```bash
pm2 status

# ✅ SUCESSO:
┌────┬───────────────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name              │ mode    │ uptime   │ ↺      │ status│ cpu      │
├────┼───────────────────┼─────────┼──────────┼────────┼──────┼──────────┤
│ 0  │ backend-gazeta    │ fork    │ 5m       │ 0-5    │ online│ 0%       │
└────┴───────────────────┴─────────┴──────────┴────────┴──────┴──────────┘
                                              ↑ deve ser baixo e não aumentar
```

---

### **Logs Esperados:**

```bash
pm2 logs backend-gazeta

# ✅ SUCESSO:
[Nest] LOG [PrismaService] 🔍 Tentando conectar ao banco: mysql://gaze_novo:***@127.0.0.1:3306/gaze_sitenovo
[Nest] LOG [PrismaService] ✅ Conectado ao banco com sucesso!
[Nest] LOG [RouterExplorer] Mapped {/api/analytics/track-view, POST}
[Nest] LOG [RouterExplorer] Mapped {/api/analytics/kpis, GET}
[Nest] LOG [RouterExplorer] Mapped {/api/analytics/access-series, GET}
[Nest] LOG [RouterExplorer] Mapped {/api/analytics/pages-series, GET}
[Nest] LOG [RouterExplorer] Mapped {/api/analytics/top-news, GET}
[Nest] LOG [RouterExplorer] Mapped {/api/analytics/activities, GET}
[Nest] LOG [NestApplication] Nest application successfully started +120ms
```

---

### **Teste de API:**

```bash
# Testar endpoint principal
curl http://localhost:3000/api
# ou
curl https://gazetadopara.com/api

# Testar Analytics
curl http://localhost:3000/api/analytics/kpis
# ou
curl https://gazetadopara.com/api/analytics/kpis
```

---

## 📝 Notas Importantes

1. **Sempre** faça `npx prisma generate` antes de fazer build local
2. **Nunca** commite arquivos `.env` no Git
3. **Sempre** verifique se os binários `.so.node` foram enviados
4. **Sempre** use URL encoding para caracteres especiais na senha do banco
5. **Mantenha** backup das credenciais em local seguro (não no Git)

---

## 🎨 Build e Deploy do Painel (Frontend)

### **Build de Produção**

```powershell
# Na sua máquina local
cd C:\workspace\site-gazeta

# Build do painel com configuração de produção
npx nx build painel-gazeta --configuration=production

# Verificar se usou environment correto (não deve ter localhost)
grep -r "localhost" dist/apps/painel-gazeta/*.js

# Deve retornar vazio (sem resultados)
```

---

### **Arquivos de Environment do Painel**

**Desenvolvimento (local):**
```typescript
// apps/painel-gazeta/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3002/api'
};
```

**Produção:**
```typescript
// apps/painel-gazeta/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://gazetadopara.com/api'
};
```

---

### **Upload do Painel**

```
LOCAL → REMOTO
──────────────────────────────────────────────────────────────────
C:\workspace\site-gazeta\dist\apps\painel-gazeta\
  → /home/gazetadopara.com/public_html/painel/
```

**Arquivos a enviar:**
- ✅ `index.html`
- ✅ `*.js` (todos os arquivos JavaScript)
- ✅ `*.css` (todos os arquivos CSS)
- ✅ `assets/` (pasta completa)
- ✅ Qualquer outro arquivo na pasta

---

### **Verificação Pós-Deploy**

1. **Acessar o painel:**
```
https://gazetadopara.com/painel
```

2. **Abrir DevTools (F12):**
   - Aba **Console**: Não deve ter erros
   - Aba **Network**: Requisições devem ir para `https://gazetadopara.com/api`

3. **Se ainda mostrar localhost:**
   - Limpar cache do navegador (`Ctrl + Shift + Delete`)
   - Forçar reload (`Ctrl + F5`)

---

## 🔗 Links Úteis

- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)
- [URL Encoding Reference](https://www.urlencoder.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Angular Environments](https://angular.io/guide/build#configuring-application-environments)

---

**Criado em:** 16/11/2025  
**Última atualização:** 16/11/2025  
**Versão:** 1.1

