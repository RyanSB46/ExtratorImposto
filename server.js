require("dotenv").config();
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// ⚙️ Configurações
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 10485760; // 10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// 📁 Criar pasta de uploads se não existir
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 🔧 Configuração de Multer com validações
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // ✅ Validar tipo de arquivo
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("❌ Apenas arquivos PDF são permitidos"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// 🌐 Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ["POST", "GET"],
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

// 📝 Logger simples
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()}: ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()}: ${msg}`)
};

// 🔍 Detecta o anexo com base em padrões de frase (não só "Anexo")
const detectarAnexoPorFrase = (text) => {
    const startIndex = text.search(/Valor do Débito por Tributo.*Atividade/i);
    if (startIndex === -1) return "Não encontrado";

    // Expande o trecho extraído para 5000 caracteres
    const trecho = text.slice(startIndex, startIndex + 5000)
        .toLowerCase()
        .normalize("NFD") // remove acentos
        .replace(/[\u0300-\u036f]/g, "") // regex que remove acentos
        .replace(/\s+/g, ' '); // remove quebras de linha e espaços duplicados

    console.log("🔍 Trecho analisado para tipo de tributação:\n", trecho);

    // Adiciona padrões mais abrangentes
    if (trecho.includes("revenda de mercadorias")) return "Anexo I";
    if (trecho.includes("mercadorias industrializadas") || trecho.includes("industria")) return "Anexo II";
    if (trecho.includes("prestacao de servicos") && trecho.includes("sem fator r")) return "Anexo III";
    if (trecho.includes("sujeitos ao anexo iv") || trecho.includes("anexo iv")) return "Anexo IV";

    // Novo padrão para "prestacao de servicos, exceto para o exterior"
    if (/prestacao de servicos.*tributados pelo anexo iii/i.test(trecho)) return "Anexo III";

    // Adicione outros padrões aqui, se necessário

    return "Não encontrado";
};


// 🧠 Função principal para extrair dados do texto do PDF
const extractData = (text) => {
    const getValue = (regex) => {
        const match = text.match(regex);
        return match ? match[1].trim() : "Não encontrado";
    };

    const receitaBrutaInformada = getValue(/Receita Bruta Informada:\s*R\$\s*([\d.,]+)/i);

    // 🔍 Receita bruta acumulada - mercado interno (linha abaixo do RBT12)
    const receitaBruta12Meses = (() => {
        const linhas = text.split('\n');
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].toLowerCase();
            if (linha.includes('receita bruta acumulada nos doze meses anteriores')) {
                const linhaSeguinte = linhas[i + 1]?.toLowerCase() || '';
                const linhaValor = linhas[i + 2]?.trim() || '';
                if (linhaSeguinte.includes('ao pa (rbt12)')) {
                    const valores = linhaValor.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);
                    return valores && valores[0] ? valores[0] : "Não encontrado";
                }
            }
        }
        return "Não encontrado";
    })();

    // 🆕 Substitui regex antiga por função mais robusta
    const tipoTributacao = detectarAnexoPorFrase(text);

    const tributos = extractTributos(text, receitaBrutaInformada) || {
        irpj: "Não encontrado",
        csll: "Não encontrado",
        cofins: "Não encontrado",
        pis_pasep: "Não encontrado",
        inss_cpp: "Não encontrado",
        icms: "Não encontrado",
        ipi: "Não encontrado",
        iss: "Não encontrado",
        total: "Não encontrado",
    };

    return {
        periodo_apuracao: getValue(/Período de Apuração:\s*([\d\/]+ a [\d\/]+)/i),
        cnpj_matriz: getValue(/CNPJ Matriz:\s*([\d./-]+)/i),
        nome_empresarial: getValue(/Nome empresarial:\s*([^\n]+)/i),
        receita_bruta_pa: getValue(/Receita Bruta do PA.*?([\d.]+,\d{2})/i),
        receita_bruta_12_meses: receitaBruta12Meses,
        tipo_tributacao: tipoTributacao,
        receita_bruta_informada: receitaBrutaInformada,
        tributos
    };
};

// 🔍 Extrator dos valores de tributos (9 casas decimais separadas)
const extractTributos = (text, receitaBrutaInformada) => {
    const startIndex = text.search(/Valor do Débito por Tributo.*Atividade/i);
    if (startIndex === -1) return null;

    const trecho = text.slice(startIndex, startIndex + 2000);
    let valores = trecho.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);

    if (!valores || valores.length < 9) return null;

    if (valores[0] === receitaBrutaInformada) {
        valores.shift(); // remove duplicado
    }

    if (valores.length < 9) return null;

    return {
        irpj: valores[0],
        csll: valores[1],
        cofins: valores[2],
        pis_pasep: valores[3],
        inss_cpp: valores[4],
        icms: valores[5],
        ipi: valores[6],
        iss: valores[7],
        total: valores[8],
    };
};

// �️ Função para limpar uploads antigos (>1 hora)
const cleanOldUploads = () => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(UPLOAD_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && stats.mtimeMs < oneHourAgo) {
          fs.unlink(filePath, (err) => {
            if (!err) logger.info(`🗑️ Arquivo antigo deletado: ${file}`);
          });
        }
      });
    });
  });
};

// 🚀 Endpoint de upload do PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "❌ Nenhum arquivo enviado" });
  }

  let filePath = null;
  try {
    filePath = req.file.path;
    logger.info(`📤 Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`);

    // ✅ Validar tamanho do arquivo
    if (req.file.size === 0) {
      throw new Error("Arquivo vazio");
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text.replace(/\r\n|\r/g, '\n').trim();

    if (!text || text.length < 100) {
      throw new Error("PDF não contém texto suficiente para processar");
    }

    logger.info(`🔍 Processando PDF com ${text.length} caracteres`);
    const extractedData = extractData(text);
    logger.info(`✅ Dados extraídos com sucesso`);

    // Deletar arquivo após processar
    fs.unlink(filePath, (err) => {
      if (err) logger.warn(`Erro ao deletar arquivo: ${err.message}`);
    });

    return res.json(extractedData);
  } catch (error) {
    logger.error(`Erro ao processar PDF: ${error.message}`);
    
    // Tentar deletar arquivo em caso de erro
    if (filePath) {
      fs.unlink(filePath, () => {});
    }

    const statusCode = error.message.includes("PDF") ? 400 : 500;
    return res.status(statusCode).json({ 
      error: `❌ ${error.message || "Erro ao processar PDF"}`,
      timestamp: new Date().toISOString()
    });
  }
});

// 🏥 Endpoint de health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    server: "running",
    timestamp: new Date().toISOString()
  });
});

// ❌ Middleware para erros de Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "FILE_TOO_LARGE") {
      return res.status(413).json({ 
        error: `❌ Arquivo muito grande. Máximo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB` 
      });
    }
    return res.status(400).json({ error: `❌ Erro no upload: ${error.message}` });
  }
  if (error) {
    logger.error(`Middleware error: ${error.message}`);
    return res.status(400).json({ error: `❌ ${error.message}` });
  }
  next();
});

// Executar limpeza a cada 30 minutos
setInterval(cleanOldUploads, 30 * 60 * 1000);

// 🚀 Inicia o servidor
app.listen(PORT, () => {
  logger.info(`✅ Servidor rodando em http://localhost:${PORT}`);
  logger.info(`📁 Diretório de uploads: ${path.resolve(UPLOAD_DIR)}`);
  logger.info(`🔒 Tamanho máximo de arquivo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`);
  logger.info(`🌐 CORS origin: ${CORS_ORIGIN}`);
});
