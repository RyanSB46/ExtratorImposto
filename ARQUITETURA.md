## 🏗️ ARQUITETURA DO PROJETO

### 📦 ESTRUTURA GERAL

```
ExtratorImposto/
│
├── 📄 Frontend (Client-side)
│   ├── index.html          → Interface web
│   └── style.css           → Design responsivo e moderno
│
├── 🖥️ Backend (Server-side)
│   ├── server.js           → API Express com processamento PDF
│   └── package.json        → Dependências do projeto
│
├── ⚙️ Configuração
│   ├── .env.example        → Variáveis de ambiente template
│   ├── .env                → Variáveis locais (não versionado)
│   └── .gitignore          → Arquivos ignorados pelo Git
│
├── 📚 Documentação
│   ├── README.md           → Documentação completa
│   ├── GUIA_RAPIDO.md      → Quick start guide
│   └── MELHORIAS.md        → Log de melhorias
│
└── 📁 uploads/             → Pasta temporária de arquivos
    └── .gitkeep           → Mantém pasta no Git
```

---

### 🔄 FLUXO DE DADOS

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  1. User selects PDF file                        │   │
│  │  2. JavaScript validates file (type, size)       │   │
│  │  3. File uploaded via FormData                   │   │
│  └────────────────┬─────────────────────────────────┘   │
└────────────────────┼──────────────────────────────────────┘
                     │ POST /upload (multipart/form-data)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              EXPRESS SERVER (Node.js)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Multer: File Storage                            │   │
│  │  - Validates MIME type                           │   │
│  │  - Checks file size (<10MB)                      │   │
│  │  - Stores in uploads/ directory                  │   │
│  └─────────────────────┬──────────────────────────┘   │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PDF Processing                                  │   │
│  │  - Read file buffer                              │   │
│  │  - Parse PDF using pdf-parse                     │   │
│  │  - Extract text content                          │   │
│  └─────────────────────┬──────────────────────────┘   │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Data Extraction                                 │   │
│  │  - extractData() function                        │   │
│  │  - Regular expressions pattern matching          │   │
│  │  - extractTributos() for tax values              │   │
│  └─────────────────────┬──────────────────────────┘   │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  File Cleanup                                    │   │
│  │  - Delete uploaded file after processing         │   │
│  │  - Schedule cleanup of old files (>1h)           │   │
│  └─────────────────────┬──────────────────────────┘   │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Response JSON                                   │   │
│  │  - Structured data with extracted info           │   │
│  │  - HTTP 200 or error status                      │   │
│  └─────────────────────┬──────────────────────────┘   │
└────────────────────────┼──────────────────────────────┘
                         │ JSON Response
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  JavaScript Display                              │   │
│  │  - Hide loading animation                        │   │
│  │  - Display results in table                      │   │
│  │  - Format field names                            │   │
│  │  - Enable download button                        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### 🔐 CAMADAS DE SEGURANÇA

```
VALIDAÇÕES FRONTEND (Client-side)
├── Verificar se arquivo foi selecionado
├── Validar tipo MIME (application/pdf)
├── Validar tamanho (10MB)
└── Mostrar mensagem de erro amigável

        ↓ (CORS Protection)

VALIDAÇÕES BACKEND (Server-side)
├── Multer File Filter
│   ├── Validar MIME type
│   └── Validar tamanho
├── Multer Error Handler
│   ├── FILE_TOO_LARGE
│   └── Outras exceções
├── Processamento de PDF
│   ├── Verificar se arquivo vazio
│   ├── Verificar conteúdo de texto
│   └── Tratamento de exceções
└── Limpeza de Recursos
    ├── Deletar arquivo após processamento
    ├── Auto-limpeza agendada
    └── Logging estruturado
```

---

### 🔌 API ENDPOINTS

#### 1. Upload PDF

```
POST /upload

Request:
  Content-Type: multipart/form-data
  Body:
    - Field: "pdf" (File)
    - Max Size: 10MB
    - Allowed Type: application/pdf

Response Success (200):
{
  "periodo_apuracao": "...",
  "cnpj_matriz": "...",
  "nome_empresarial": "...",
  "receita_bruta_pa": "...",
  "receita_bruta_12_meses": "...",
  "tipo_tributacao": "...",
  "receita_bruta_informada": "...",
  "tributos": { ... }
}

Response Error (400/413/500):
{
  "error": "❌ Descrição do erro",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

#### 2. Health Check

```
GET /health

Response (200):
{
  "status": "OK",
  "server": "running",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

---

### ⚙️ VARIÁVEIS DE AMBIENTE

```bash
# Server
PORT=3000                              # Porta do servidor
NODE_ENV=development                   # Ambiente (development/production)

# Upload
MAX_FILE_SIZE=10485760                # 10MB em bytes
UPLOAD_DIR=uploads                    # Diretório temporário

# CORS
CORS_ORIGIN=http://localhost:3000    # Origem CORS permitida

# Logging
LOG_LEVEL=info                        # Nível de logging
```

---

### 📊 FLUXO DE EXTRAÇÃO DE DADOS

```
PDF Text ──→ detectarAnexoPorFrase()
         ├─ Procura por padrões fiscais
         ├─ Remove acentos e normaliza
         └─ Retorna: "Anexo I/II/III/IV"

PDF Text ──→ extractData()
         ├─ getValue() → Regex matching
         ├─ Período de apuração
         ├─ CNPJ Matriz
         ├─ Nome empresarial
         ├─ Receita Bruta PA
         ├─ Receita Bruta 12 meses
         ├─ Tipo Tributação
         └─ Tributos (via extractTributos)

PDF Text ──→ extractTributos()
         ├─ Encontra seção "Valor do Débito"
         ├─ Extrai 9 valores (IRPJ, CSLL, etc)
         ├─ Remove valor duplicado se presente
         └─ Retorna objeto com 9 tributos
```

---

### 🎨 ARQUITETURA FRONTEND

```
index.html
├── HTML Structure
│   ├── Upload Section
│   ├── Loading Indicator
│   ├── Results Table
│   └── Action Buttons
│
├── CSS (style.css)
│   ├── Gradient Background
│   ├── Responsive Layout
│   ├── Modern Components
│   └── Animations & Transitions
│
└── JavaScript
    ├── uploadPDF()          → Controlador principal
    ├── validateFile()       → Validações
    ├── displayResults()     → Renderização
    ├── downloadResults()    → Export JSON
    ├── clearResults()       → Limpeza UI
    └── Event Listeners
```

---

### 📈 PERFORMANCE

- **Limite de arquivo:** 10MB (configurável)
- **Timeout implícito:** Depende do Node.js/sistema
- **Limpeza de uploads:** A cada 30 minutos
- **Cache:** Nenhum (cada PDF é reprocessado)

---

### 🔄 CICLO DE VIDA DE UM UPLOAD

```
1. User selects PDF
   ↓
2. Frontend validates
   ├─ File exists?
   ├─ PDF type?
   └─ Size <10MB?
   ↓
3. POST /upload com FormData
   ↓
4. Multer receive & store
   ├─ Validate MIME type
   ├─ Check size limit
   └─ Save to uploads/
   ↓
5. PDF Processing
   ├─ Read file buffer
   ├─ Parse PDF content
   └─ Extract text
   ↓
6. Data Extraction
   ├─ Run regex patterns
   ├─ Extract tributos
   └─ Format response
   ↓
7. File Cleanup
   ├─ Delete uploaded file
   ├─ Log operation
   └─ Send JSON response
   ↓
8. Frontend Display
   ├─ Parse JSON
   ├─ Format display
   └─ Show results table
   ↓
9. User Actions
   ├─ Download as JSON
   ├─ Clear results
   └─ Upload another PDF
```

---

### 🛡️ TRATAMENTO DE ERROS

```
Try-Catch na API:
├─ Multer Errors (tipo, tamanho)
├─ File Read Errors
├─ PDF Parse Errors
├─ Data Extraction Errors
└─ File Cleanup Errors

Response ao User:
├─ Mensagem em português
├─ HTTP Status apropriado
├─ Timestamp do erro
└─ Logging no servidor
```

---

**Versão da Arquitetura:** 1.1.0
**Data:** Janeiro 2026
