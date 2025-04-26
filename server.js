const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

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

// 🚀 Endpoint de upload do PDF
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

// Inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
