# License Key Validation System

A complete full-stack license key validation system with admin panel, public API, and C++ integration.

## 🏗️ Architecture

- **Frontend & Backend**: Next.js 14 (App Router, TypeScript)
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (admin only)
- **C++ Integration**: Windows API (WinHTTP, CryptoAPI)

## 📦 Features

### Admin Panel
- 🔐 Secure authentication (email/password)
- 📊 Dashboard with license key statistics
- 🔑 Generate new license keys (shown once, then hashed)
- ✏️ Activate/deactivate license keys
- 🗑️ Delete license keys
- 📅 Optional expiration dates
- 📈 Real-time statistics (total, active, inactive, expired)

### Public API
- 🌐 `POST /api/verify-key` - Validate license keys
- 🔒 SHA-256 hashing (never stores plain keys)
- ⏱️ Rate limiting (10 requests/minute per IP)
- 📊 Updates `last_used_at` timestamp
- ✅ Proper HTTP status codes and JSON responses

### C++ Integration
- 🪟 Windows native (no external dependencies)
- 🔐 SHA-256 hashing using CryptoAPI
- 🌐 HTTPS requests using WinHTTP
- 📄 Simple JSON parsing
- 🛡️ Error handling and validation

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone your-github-repo-url
cd license-key-validation-system
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:

```bash
# Copy and execute the SQL from sql/schema.sql
```

3. Go to **Authentication > Users** and create an admin user
4. Copy your credentials from **Settings > API**

### 3. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Development

```bash
npm run dev
# Visit http://localhost:3000
```

### 5. GitHub Setup

```bash
# Initialize Git repository
git init
git add .
git commit -m "Initial commit - License Key Validation System"

# Create GitHub repository and push
# Replace 'your-username' and 'your-repo-name'
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

### 6. Deploy to Vercel

#### Via Dashboard (Recomendado):
1. Acesse: https://vercel.com
2. **Import Project** → Conecte GitHub
3. Selecione seu repositório
4. **Framework:** Next.js (automático)

#### Via CLI:
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 7. Configure Environment Variables in Vercel

**❗ CRÍTICO: Configure ANTES do primeiro deploy, senão o build falhará!**

#### Opção 1: Script Automático (Recomendado)
```bash
# Execute localmente para gerar comandos do Vercel
node configure-vercel.js
```

#### Opção 2: Manual no Dashboard
1. Vá para seu projeto no Vercel
2. **Settings** → **Environment Variables**
3. Adicione exatamente:

| Variable | Value | Environment |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hdcnlpxusmvfmtqhseoo.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[sua chave completa]` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `[sua chave completa]` | Production |

**⚠️ IMPORTANTE:**
- Configure **ANTES** do deploy
- Use "Production" para produção
- Copie das suas configurações locais (`.env.local`)

### 8. Update C++ App for Production

Após deploy, atualize seu C++:

```cpp
// Mude no entryPoint.cpp:
LicenseValidator g_LicenseValidator("SEU-DOMINIO.vercel.app", false);
```

**Exemplo:**
```cpp
LicenseValidator g_LicenseValidator("license-key-system.vercel.app", false);
```

## 📋 API Documentation

### POST /api/verify-key

Validate a license key.

**Request:**
```json
{
  "key": "ABCD-EFGH-IJKL-MNOP"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "expires_at": "2024-12-31T23:59:59Z",
  "message": "License key is valid"
}
```

**Error Response (200):**
```json
{
  "valid": false,
  "error": "License key not found"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Too many requests. Please try again later."
}
```

## 🔐 Security

- ✅ **Minimal Dependencies**: Only essential packages to reduce attack surface
- ✅ **No Vulnerable Libraries**: Removed axios, lodash, ejs dependencies
- ✅ **SHA-256 Hashing**: License keys never stored in plain text
- ✅ **HTTPS Only**: Vercel enforces SSL/TLS encryption
- ✅ **Row Level Security**: Database access control with RLS policies
- ✅ **Rate Limiting**: API protected against abuse (10 req/min per IP)
- ✅ **Admin Authentication**: Protected admin panel with Supabase Auth
- ✅ **Secure Headers**: Next.js automatic security headers
- ✅ **Environment Variables**: Sensitive data properly secured

## 🪟 C++ Integration Example

See `cpp-example/license_validator.cpp` for a complete Windows C++ implementation that:

1. Prompts user for license key
2. Hashes key with SHA-256
3. Sends HTTPS POST to validation API
4. Parses JSON response
5. Allows/blocks application execution

### Compilation (Visual Studio)

1. Create new **Windows Console Application**
2. Replace main .cpp with `cpp-example/license_validator.cpp`
3. Ensure these libraries are linked:
   - `winhttp.lib`
   - `crypt32.lib`
4. Build in Release configuration

### Usage

```cpp
// Update the domain in the code
LicenseValidator validator("your-vercel-domain.vercel.app");
```

## 📊 Database Schema

```sql
CREATE TABLE license_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

## 🔧 Development Scripts

```bash
# Generate TypeScript types from Supabase
npm run db:generate

# Push database changes
npm run db:push

# Reset database
npm run db:reset
```

## 🌐 Production Deployment

### Vercel Configuration

The project includes `vercel.json` with optimized settings:

- 10-second function timeout for API routes
- Frankfurt region (fra1)
- Environment variables properly configured

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |

## 🛠️ Troubleshooting

### Admin Login Issues
- Ensure user exists in Supabase Auth
- Check environment variables are correct
- Verify RLS policies allow admin access

### API Validation Issues
- Check license key format (XXXX-XXXX-XXXX-XXXX)
- Verify key exists and is active in database
- Check API rate limits (10 requests/minute)

### C++ Compilation Issues
- Ensure Windows SDK is installed
- Link required libraries: `winhttp.lib`, `crypt32.lib`
- Use Release configuration for production

### Database Issues
- Run schema.sql in Supabase SQL Editor
- Check RLS policies are enabled
- Verify user has admin role for key creation

## 📝 License

This project is provided as-is for educational and commercial use. Modify and distribute according to your needs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Create an issue with detailed information

---

**Built with ❤️ using Next.js, Supabase, and C++**