#  Extrator de Informações Tributárias - PDF

Sistema completo Node.js com Express.js para upload, processamento e extração de informações tributárias de arquivos PDF de empresas brasileiras. O sistema extrai dados como CNPJ, nome empresarial, receita bruta e valores de tributos federais, estaduais e municipais.

##  Funcionalidades

-  Upload seguro de arquivos PDF com validações
-  Extração automática de:
  - Período de apuração
  - CNPJ da matriz
  - Nome empresarial
  - Receita bruta do período
  - Receita bruta dos 12 meses anteriores
  - Tipo de tributação (Anexo I, II, III, IV)
  - Receita Bruta informada
  - Tributos: IRPJ, CSLL, COFINS, PIS/Pasep, INSS/CPP, ICMS, IPI, ISS, Total
-  Limpeza automática de arquivos temporários
-  Interface moderna e responsiva
-  Download de resultados em JSON
-  Health check do servidor
-  Logging estruturado
-  Configuração via variáveis de ambiente

##  Segurança

- Validação de tipo de arquivo (apenas PDF)
- Limite de tamanho de arquivo configurável (padrão: 10MB)
- Armazenamento temporário com auto-limpeza
- Tratamento de erros robusto
- CORS configurável
- Multer com proteção contra ataques

##  Tecnologias

- [Node.js](https://nodejs.org/) - Runtime JavaScript
- [Express.js](https://expressjs.com/) - Framework web
- [Multer](https://github.com/expressjs/multer) - Upload de arquivos
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - Leitura de PDF
- [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) - Processamento PDF
- [CORS](https://www.npmjs.com/package/cors) - Requisições entre origens
- [dotenv](https://www.npmjs.com/package/dotenv) - Variáveis de ambiente

##  Instalação Rápida

### Pré-requisitos
- Node.js v14+ instalado
- npm ou yarn

### Passos

1. **Clone ou navegue até o repositório:**
\\\ash
cd ExtratorImposto
\\\

2. **Instale as dependências:**
\\\ash
npm install
\\\

3. **Configure as variáveis de ambiente:**
\\\ash
cp .env.example .env
\\\

Edite o arquivo \.env\ conforme necessário:
\\\env
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
\\\

4. **Inicie o servidor:**
\\\ash
npm start
\\\

5. **Acesse a aplicação:**
\\\
http://localhost:3000
\\\

##  Endpoint \/upload\

### Requisição

- **Método:** \POST\
- **URL:** \http://localhost:3000/upload\
- **Content-Type:** \multipart/form-data\
- **Campo:** \pdf\ (arquivo PDF)

### Exemplo com cURL

\\\ash
curl -X POST http://localhost:3000/upload \
  -F "pdf=@documento.pdf"
\\\

### Exemplo com JavaScript

\\\javascript
const formData = new FormData();
formData.append('pdf', fileinput.files[0]);

const response = await fetch('http://localhost:3000/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data);
\\\

##  Resposta Esperada

\\\json
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
\\\

##  Health Check

Para verificar se o servidor está rodando:

\\\ash
curl http://localhost:3000/health
\\\

Resposta:
\\\json
{
  "status": "OK",
  "server": "running",
  "timestamp": "2026-01-15T10:30:00.000Z"
}
\\\

##  Estrutura do Projeto

\\\
ExtratorImposto/
 index.html          # Frontend da aplicação
 style.css           # Estilos CSS
 server.js           # Servidor Express (backend)
 package.json        # Dependências e scripts
 .env.example        # Exemplo de configuração
 .gitignore          # Arquivos ignorados pelo Git
 README.md           # Este arquivo
 uploads/            # Pasta de uploads (criada automaticamente)
     .gitkeep        # Arquivo para manter a pasta no Git
\\\

##  Configuração Avançada

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| \PORT\ | 3000 | Porta do servidor |
| \NODE_ENV\ | development | Ambiente (development/production) |
| \MAX_FILE_SIZE\ | 10485760 | Tamanho máximo do arquivo em bytes (10MB) |
| \UPLOAD_DIR\ | uploads | Diretório para arquivos temporários |
| \CORS_ORIGIN\ | http://localhost:3000 | Origem CORS permitida |
| \LOG_LEVEL\ | info | Nível de logging |

### Limpeza de Uploads

- Arquivos são automaticamente deletados após processamento
- Limpeza de arquivos antigos (>1 hora) executada a cada 30 minutos

##  Troubleshooting

### Erro: "Servidor não está acessível"
- Verifique se o servidor está rodando: \
pm start\
- Confirme que a porta 3000 está livre
- Verifique o firewall

### Erro: "Arquivo muito grande"
- Aumente \MAX_FILE_SIZE\ no arquivo \.env\
- Padrão atual: 10MB

### Erro: "Apenas arquivos PDF são permitidos"
- Certifique-se de que o arquivo é um PDF válido
- Verifique se o arquivo não está corrompido

### Erro: "PDF não contém texto suficiente"
- O PDF pode ser escaneado (imagem)
- Tente usar um PDF com texto extraível

##  Scripts

\\\ash
# Iniciar o servidor
npm start

# Modo desenvolvimento (igual a npm start)
npm run dev

# Executar testes (não implementados ainda)
npm test
\\\

##  Contribuindo

Contribuições são bem-vindas! Por favor:
1. Faça um fork
2. Crie uma branch para sua feature (\git checkout -b feature/AmazingFeature\)
3. Commit suas mudanças (\git commit -m 'Add some AmazingFeature'\)
4. Push para a branch (\git push origin feature/AmazingFeature\)
5. Abra um Pull Request

##  Roadmap

- [ ] Testes unitários e de integração
- [ ] Suporte a processamento em lote
- [ ] Banco de dados para histórico
- [ ] Autenticação de usuários
- [ ] Dashboard com estatísticas
- [ ] Suporte a outros tipos de documento
- [ ] API GraphQL
- [ ] Containerização Docker

##  Licença

Este projeto está licenciado sob a licença ISC - veja o arquivo LICENSE para detalhes.

##  Autor

Desenvolvido por **Ryan Sena** e a equipe de desenvolvimento.

##  Suporte

Para reportar bugs ou solicitar features, abra uma issue no repositório.

---

**Última atualização:** Janeiro 2026
**Versão:** 1.1.0
