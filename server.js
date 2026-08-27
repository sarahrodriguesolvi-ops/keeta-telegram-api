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

// Função para extrair base64 e tipo MIME
function extrairBase64(dataUrl) {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimeType: matches[1],
    base64: matches[2]
  };
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

    // Enviar para o Telegram
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Configuração do Telegram incompleta');
      return res.status(500).json({
        success: false,
        message: 'Configuração do Telegram incompleta. Verifique o arquivo .env'
      });
    }

    // 1. Enviar mensagem de texto primeiro
    const mensagem = formatarMensagem(req.body);
    const urlMensagem = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const responseMsg = await axios.post(urlMensagem, {
      chat_id: TELEGRAM_CHAT_ID,
      text: mensagem,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    if (!responseMsg.data.ok) {
      throw new Error('Erro ao enviar mensagem de texto para o Telegram');
    }

    // 2. Enviar fotos se houver
    const fotos = req.body.fotos || {};
    const fotosEnviadas = [];
    const fotosErro = [];

    for (const [nome, dataUrl] of Object.entries(fotos)) {
      if (!dataUrl) continue;
      
      const arquivo = extrairBase64(dataUrl);
      if (!arquivo) {
        console.warn(`Formato inválido para foto: ${nome}`);
        fotosErro.push(nome);
        continue;
      }

      try {
        // Converter base64 para Buffer
        const buffer = Buffer.from(arquivo.base64, 'base64');
        
        // Upload para file.io temporariamente e enviar URL para Telegram
        const uploadResponse = await axios.post('https://file.io', buffer, {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          params: {
            expires: '1d'
          },
          maxBodyLength: 50 * 1024 * 1024,
          timeout: 30000
        });
        
        if (!uploadResponse.data || !uploadResponse.data.link) {
          throw new Error('Falha ao fazer upload da imagem');
        }
        
        const imageUrl = uploadResponse.data.link;
        console.log(`Imagem uploadada: ${imageUrl}`);
        
        const urlFoto = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        
        const legenda = nome === 'fotoFaixa' ? '🖼️ Fachada da Loja' :
                       nome === 'fotoInterior' ? '🖼️ Interior da Loja' :
                       nome === 'fotoCardapio' ? '🖼️ Cardápio' : `🖼️ ${nome}`;
        
        const response = await axios.post(urlFoto, {
          chat_id: TELEGRAM_CHAT_ID,
          photo: imageUrl,
          caption: legenda
        });
        
        if (response.data && response.data.ok) {
          fotosEnviadas.push(nome);
          console.log(`Foto enviada com sucesso: ${nome}`);
        } else {
          console.error(`Resposta inesperada do Telegram para ${nome}:`, response.data);
          fotosErro.push(nome);
        }
      } catch (erroFoto) {
        console.error(`Erro ao enviar foto ${nome}:`, erroFoto.response?.data || erroFoto.message);
        fotosErro.push(nome);
      }
    }

    console.log('Mensagem e fotos enviadas com sucesso para o Telegram');
    return res.status(200).json({
      success: true,
      message: 'Cadastro enviado com sucesso para o Telegram!',
      telegramMessageId: responseMsg.data.result.message_id,
      fotosEnviadas: fotosEnviadas,
      fotosErro: fotosErro
    });

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

// Rota raiz - serve o formulário
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'formulario.html'));
});

// Rota do formulário
app.get('/formulario.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'formulario.html'));
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
