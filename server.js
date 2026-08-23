const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Configurações do Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Função para formatar a mensagem igual ao exemplo da imagem
function formatarMensagem(dados) {
  const {
    idCliente,
    vendedor,
    restaurante,
    razaoSocial,
    proprietario,
    telProprietario,
    telLoja,
    cnpj,
    cpf,
    banco,
    agencia,
    conta,
    titular,
    sistema,
    taxaKeeta,
    taxaIfood,
    observacoes
  } = dados;

  let mensagem = '';

  // Cabeçalho
  mensagem += '🏢 *CADASTRO DE LOJA - KEETA*\n';
  mensagem += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // ID e Vendedor
  mensagem += `🆔 *ID do Cliente:* ${idCliente || 'Não informado'}\n`;
  mensagem += `👤 *Vendedor:* ${vendedor || 'Não informado'}\n`;
  mensagem += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Dados do Restaurante
  mensagem += `🏪 *Restaurante:* ${restaurante || 'Não informado'}\n`;
  mensagem += `📄 *Razão Social:* ${razaoSocial || 'Não informado'}\n\n`;

  // Proprietário e Contatos
  mensagem += `👨‍💼 *Proprietário:* ${proprietario || 'Não informado'}\n`;
  mensagem += `📱 *Tel. Proprietário:* ${telProprietario || 'Não informado'}\n`;
  mensagem += `☎️ *Tel. Loja:* ${telLoja || 'Não informado'}\n\n`;

  // Documentos
  mensagem += `🏛️ *CNPJ:* ${cnpj || 'Não informado'}\n`;
  mensagem += `🪪 *CPF:* ${cpf || 'Não informado'}\n`;
  mensagem += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Dados Bancários
  mensagem += '🏦 *DADOS BANCÁRIOS*\n';
  mensagem += '━━━━━━━━━━━━━━━━━━━━━━\n';
  mensagem += `*Banco:* ${banco || 'Não informado'}\n`;
  mensagem += `*Agência:* ${agencia || 'Não informado'}\n`;
  mensagem += `*Conta:* ${conta || 'Não informado'}\n`;
  mensagem += `*Titular:* ${titular || 'Não informado'}\n`;
  mensagem += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // Sistema e Taxas
  mensagem += `💻 *Sistema:* ${sistema || 'Não informado'}\n`;
  mensagem += `📊 *Taxa Keeta:* ${taxaKeeta || 'Não informado'}\n`;
  mensagem += `📊 *Taxa iFood:* ${taxaIfood || 'Não informado'}\n\n`;

  // Observações
  if (observacoes) {
    mensagem += `📝 *Observações:*\n${observacoes}\n\n`;
  }

  mensagem += '━━━━━━━━━━━━━━━━━━━━━━\n';
  mensagem += `📅 *Data:* ${new Date().toLocaleString('pt-BR')}`;

  return mensagem;
}

// Endpoint para receber dados do formulário
app.post('/api/enviar-cadastro', async (req, res) => {
  try {
    console.log('Dados recebidos:', req.body);

    // Validar dados obrigatórios
    const camposObrigatorios = ['restaurante', 'cnpj', 'proprietario'];
    const camposFaltantes = camposObrigatorios.filter(campo => !req.body[campo]);

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios faltando: ${camposFaltantes.join(', ')}`
      });
    }

    // Formatar mensagem
    const mensagem = formatarMensagem(req.body);

    // Enviar para o Telegram
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Configuração do Telegram incompleta');
      return res.status(500).json({
        success: false,
        message: 'Configuração do Telegram incompleta. Verifique o arquivo .env'
      });
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: mensagem,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    if (response.data.ok) {
      console.log('Mensagem enviada com sucesso para o Telegram');
      return res.status(200).json({
        success: true,
        message: 'Cadastro enviado com sucesso para o Telegram!',
        telegramMessageId: response.data.result.message_id
      });
    } else {
      throw new Error('Resposta inesperada do Telegram');
    }

  } catch (error) {
    console.error('Erro ao enviar para o Telegram:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Erro ao enviar cadastro para o Telegram',
      error: error.response?.data?.description || error.message
    });
  }
});

// Endpoint de saúde (health check)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Keeta - Telegram',
    endpoints: {
      'POST /api/enviar-cadastro': 'Envia dados do formulário para o Telegram',
      'GET /health': 'Verifica se a API está funcionando'
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📋 Endpoint: POST http://localhost:${PORT}/api/enviar-cadastro`);
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  ATENÇÃO: Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no arquivo .env');
  }
});
