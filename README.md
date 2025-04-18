# 📄 Projeto - Leitor de PDF de Tributos

Este é um projeto Node.js com Express.js para upload e análise de arquivos PDF que contenham informações tributárias de empresas. O sistema extrai dados como CNPJ, nome empresarial, receita bruta e valores de tributos como IRPJ, CSLL, PIS, COFINS, entre outros.

## 🚀 Funcionalidades

- Upload de arquivos PDF via endpoint `/upload`
- Extração de:
  - Período de apuração
  - CNPJ da matriz
  - Nome empresarial
  - Receita bruta do período
  - Receita bruta dos 12 meses anteriores
  - Tipo de tributação (por Anexo)
  - Receita Bruta informada
  - Tributos: IRPJ, CSLL, COFINS, PIS/Pasep, INSS/CPP, ICMS, IPI, ISS, Total

## 📦 Tecnologias Utilizadas

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Multer](https://github.com/expressjs/multer) para upload de arquivos
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) para leitura do conteúdo do PDF
- [CORS](https://www.npmjs.com/package/cors) para permitir requisições de outras origens

## 🧑‍💻 Instalação e Uso

1. Clone o repositório:
  

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

4. O servidor estará disponível em:
   ```
   http://localhost:3000
   ```

## 📤 Endpoint `/upload`

- **Método:** `POST`
- **Content-Type:** `multipart/form-data`
- **Campo do arquivo:** `pdf`

### Exemplo com `curl`:

```bash
curl -X POST http://localhost:3000/upload \
  -F "pdf=@caminho/do/arquivo.pdf"
```

### Retorno esperado:

```json
{
  "periodo_apuracao": "01/01/2024 a 31/01/2024",
  "cnpj_matriz": "12.345.678/0001-99",
  "nome_empresarial": "EMPRESA DE EXEMPLO LTDA",
  "receita_bruta_pa": "100.000,00",
  "receita_bruta_12_meses": "1.200.000,00",
  "tipo_tributacao": "Anexo III",
  "receita_bruta_informada": "120.000,00",
  "tributos": {
    "irpj": "0,00",
    "csll": "0,00",
    "cofins": "500,00",
    "pis_pasep": "100,00",
    "inss_cpp": "1.000,00",
    "icms": "0,00",
    "ipi": "0,00",
    "iss": "2.000,00",
    "total": "3.600,00"
  }
}
```

## 📁 Estrutura do Projeto

```

├── uploads/              # Pasta onde os arquivos PDF são temporariamente armazenados
├── server.js             # Servidor principal Express
├── package.json          # Configurações do projeto e dependências
```

## 📄 Licença

Este projeto está licenciado sob a licença ISC.

---

Desenvolvido por **Ryan Sena**
