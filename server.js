const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const extractData = (text) => {
    const getValue = (regex) => {
        const match = text.match(regex);
        return match ? match[1].trim() : "Não encontrado";
    };

    const extractTributos = () => {
        const startIndex = text.search(/Valor do Débito por Tributo.*Atividade/i);
        if (startIndex === -1) return null;

        const trecho = text.slice(startIndex, startIndex + 2000);
        const valoresMatch = trecho.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);

        if (!valoresMatch || valoresMatch.length < 9) return null;

        const valores = valoresMatch.slice(0, 9); // Pega só os 9 primeiros

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

    const tributos = extractTributos() || {
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
        receita_bruta_12_meses: getValue(/Receita bruta acumulada nos doze meses anteriores.*?([\d.]+,\d{2})/i),
        tipo_tributacao: getValue(/tributados pelo\s+(Anexo\s+[IVX]+)/i),
        receita_bruta_informada: getValue(/Receita Bruta Informada:\s*R\$\s*([\d.,]+)/i),
        tributos
    };
};

app.post("/upload", upload.single("pdf"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);
        const text = data.text.replace(/\r\n|\r/g, '\n').trim();

        console.log("🔍 TEXTO EXTRAÍDO (preview):\n", text.slice(0, 1000));
        const extractedData = extractData(text);
        console.log("📦 DADOS EXTRAÍDOS:\n", extractedData);

        res.json(extractedData);
    } catch (error) {
        console.error("❌ Erro ao processar PDF:", error);
        res.status(500).json({ error: "Erro ao processar PDF" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
