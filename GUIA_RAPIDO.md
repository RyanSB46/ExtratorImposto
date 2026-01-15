## 🚀 GUIA RÁPIDO DE INÍCIO

### 1️⃣ INSTALAÇÃO E SETUP (5 minutos)

```bash
# Navegar até a pasta do projeto
cd ExtratorImposto

# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Iniciar o servidor
npm start
```

### 2️⃣ ACESSAR A APLICAÇÃO

- **Frontend:** http://localhost:3000
- **API Upload:** POST http://localhost:3000/upload
- **Health Check:** GET http://localhost:3000/health

### 3️⃣ USAR A APLICAÇÃO

1. Abra http://localhost:3000 no navegador
2. Clique em "📤 Enviar e Processar PDF"
3. Selecione um arquivo PDF válido
4. Os dados serão extraídos automaticamente
5. Clique em "⬇️ Baixar Resultados" para salvar em JSON

### 4️⃣ CONFIGURAÇÕES

Edite o arquivo `.env` para alterar:

```env
PORT=3000                              # Porta do servidor
NODE_ENV=development                   # Ambiente
MAX_FILE_SIZE=10485760                # Limite de arquivo (10MB)
UPLOAD_DIR=uploads                    # Pasta de uploads
CORS_ORIGIN=http://localhost:3000    # Origem CORS
LOG_LEVEL=info                        # Nível de logging
```

### 5️⃣ TROUBLESHOOTING

| Erro | Solução |
|------|---------|
| Porta 3000 em uso | Mude `PORT` no `.env` |
| Arquivo não processa | Verifique se é PDF válido com texto |
| Servidor não inicia | Execute `npm install` novamente |
| CORS error | Verifique `CORS_ORIGIN` no `.env` |

### 📦 ESTRUTURA DE RESPOSTA

```json
{
  "periodo_apuracao": "01/01/2024 a 31/01/2024",
  "cnpj_matriz": "12.345.678/0001-99",
  "nome_empresarial": "EMPRESA LTDA",
  "receita_bruta_pa": "100.000,00",
  "receita_bruta_12_meses": "1.200.000,00",
  "tipo_tributacao": "Anexo III",
  "receita_bruta_informada": "120.000,00",
  "tributos": {
    "irpj": "valor",
    "csll": "valor",
    "cofins": "valor",
    "pis_pasep": "valor",
    "inss_cpp": "valor",
    "icms": "valor",
    "ipi": "valor",
    "iss": "valor",
    "total": "valor"
  }
}
```

### 🔗 ENDPOINTS DISPONÍVEIS

```bash
# Upload de PDF
POST /upload
Content-Type: multipart/form-data
Body: { pdf: File }

# Verificar saúde do servidor
GET /health
Response: { status: "OK", server: "running", timestamp: "..." }
```

### 📊 LOGS DO SERVIDOR

O servidor exibe logs estruturados:
- `[INFO]` - Informações gerais
- `[ERROR]` - Erros encontrados
- `[WARN]` - Avisos

Exemplo:
```
[INFO] 2026-01-15T10:30:00.123Z: ✅ Servidor rodando em http://localhost:3000
[INFO] 2026-01-15T10:31:15.456Z: 📤 Arquivo recebido: documento.pdf (250000 bytes)
[INFO] 2026-01-15T10:31:16.789Z: ✅ Dados extraídos com sucesso
```

### 🧹 LIMPEZA AUTOMÁTICA

- Arquivos são deletados após processamento
- Arquivos antigos (>1 hora) são deletados a cada 30 minutos
- A pasta `uploads/` mantém apenas arquivos em processamento

### 💾 SALVANDO RESULTADOS

No frontend, clique em "⬇️ Baixar Resultados" para salvar como:
- Formato: JSON
- Nome: `extrato-impostos-YYYY-MM-DD.json`
- Local: Pasta Downloads do seu computador

---

**✅ Pronto! O projeto está totalmente melhorado e pronto para uso!**

Para mais detalhes, consulte README.md e MELHORIAS.md
