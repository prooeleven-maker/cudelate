# Deploy no Vercel - Guia Completo

## 🚀 Deploy Automático

### Passo 1: Push para GitHub
```bash
# Se ainda não fez:
git add .
git commit -m "Sistema de validação de licenças completo"
git push origin main
```

### Passo 2: Deploy no Vercel

#### Opção A: Via Dashboard (Recomendado)
1. Acesse: https://vercel.com
2. Clique: "Import Project"
3. Conecte sua conta GitHub
4. Selecione o repositório `license-key-system`
5. Configure:

**Framework Preset:** Next.js
**Root Directory:** `./` (padrão)

#### Opção B: Via CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 🔧 Configurar Variáveis de Ambiente

### Método 1: Via CLI (Mais Fácil)

Execute este script localmente para gerar os comandos:

```bash
node configure-vercel.js
```

Ele irá mostrar os comandos exatos para configurar o Vercel.

### Método 2: Via Dashboard

1. Vá para seu projeto no Vercel
2. **Settings** → **Environment Variables**
3. Adicione estas variáveis:

| Name | Value | Environment |
|------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hdcnlpxusmvfmtqhseoo.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[sua chave completa]` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `[sua chave completa]` | Production |

### ⚠️ IMPORTANTE:
- **Configure ANTES do primeiro deploy**
- Use exatamente estes nomes
- Cole as chaves **COMPLETAS** do Supabase
- Selecione "Production" para produção

## 🎯 Após Deploy:

### 1. URL do Projeto
Após deploy, você terá uma URL como:
```
https://license-key-system.vercel.app
```

### 2. Testar Sistema
1. Acesse: `https://SEU-DOMINIO.vercel.app`
2. Vá para: `/admin`
3. Faça login com usuário Supabase
4. Teste geração de chaves

### 3. API Endpoint
Sua API estará disponível em:
```
https://SEU-DOMINIO.vercel.app/api/verify-key
```

## 🛠️ Troubleshooting

### Erro: "Variável não existe"
- Verifique se copiou as chaves corretas do Supabase
- Certifique-se de que não há espaços extras
- Recarregue o projeto no Vercel

### Erro: "Build falhou"
```bash
# Teste local primeiro:
npm run build
npm run dev
```

### Erro: "Não conecta ao Supabase"
- Verifique se o projeto Supabase está ativo
- Confirme as chaves no dashboard do Supabase

## 🔄 Atualizações

Para atualizar o projeto:
```bash
# Faça mudanças locais
git add .
git commit -m "Minha atualização"
git push origin main

# Vercel fará deploy automático
```

## 🎉 Deploy Concluído!

Após seguir estes passos, você terá:

- ✅ **Site online** no Vercel
- ✅ **Admin panel** funcional
- ✅ **API de validação** ativa
- ✅ **Banco seguro** no Supabase
- ✅ **Código C++** pronto para usar

**URL final:** `https://SEU-PROJETO.vercel.app`