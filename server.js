const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// 📌 Função para extrair dados do texto do PDF
const extractData = (text) => {
    const getValue = (regex) => {
        const match = text.match(regex);
        return match ? match[1].trim() : "Não encontrado";
    };

    // 🎯 Extrai os valores dos tributos corretamente
    const extractTributos = () => {
        const blocoTributosRegex = /IRPJ\s+CSLL\s+COFINS\s+PIS\/Pasep\s+INSS\/CPP\s+ICMS\s+IPI\s+ISS\s+Total\s*\n([\d.,\s]+)/i;
        const match = text.match(blocoTributosRegex);

        if (!match || !match[1]) return null;

        // 💸 Extrair os 9 valores esperados com segurança
        const valores = match[1].trim().split(/\s+/);
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
        receita_bruta_pa: getValue(/Receita Bruta do PA.*?([0-9.]+,[0-9]{2})/i),
        receita_bruta_12_meses: getValue(/Receita bruta acumulada nos doze meses anteriores ao PA.*?([0-9.]+,[0-9]{2})/i),
        tipo_tributacao: getValue(/tributados pelo (Anexo [IVXI]+)/i),
        receita_bruta_informada: getValue(/Receita Bruta Informada: R\$ ([\d.,]+)/i),
        tributos,
    };
};


// 📤 Rota para upload do PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(dataBuffer);

        const text = data.text.replace(/\r\n|\r/g, '\n').trim();
        console.log("\n🔍 TEXTO EXTRAÍDO DO PDF:\n", text.slice(0, 5000)); // corta pra evitar excesso
const extractedData = extractData(text);
console.log("\n📦 BLOCO DE TRIBUTOS CAPTURADO:\n", extractedData.tributos_extraidos);
res.json(extractedData);

    } catch (error) {
        console.error("❌ Erro ao processar PDF:", error);
        res.status(500).json({ error: "Erro ao processar PDF" });
    }
});

// 🚀 Inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
