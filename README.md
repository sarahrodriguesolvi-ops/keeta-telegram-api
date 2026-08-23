# API Keeta - Telegram

API para receber dados do formulário de cadastro do Keeta e enviar formatados para um grupo do Telegram.

## Funcionalidades

- Recebe dados do formulário via POST
- Formata a mensagem com emojis e estrutura visual profissional
- Envia automaticamente para o grupo do Telegram
- Validação de campos obrigatórios

## Estrutura da Mensagem

A mensagem enviada segue o formato da imagem de exemplo:

```
🏢 CADASTRO DE LOJA - KEETA
━━━━━━━━━━━━━━━━━━━━━━

🆔 ID do Cliente: 51137965
👤 Vendedor: Heraclito
━━━━━━━━━━━━━━━━━━━━━━

🏪 Restaurante: Santa Arepa
📄 Razão Social: Alexandra Arciniegas Gutierrez

👨‍💼 Proprietário: Alexandra
📱 Tel. Proprietário: (48) 98866-9947
☎️ Tel. Loja: (48) 8880-3367

🏛️ CNPJ: 60.453.207/0001-43
🪪 CPF: 802.448.169-30
━━━━━━━━━━━━━━━━━━━━━━

🏦 DADOS BANCÁRIOS
━━━━━━━━━━━━━━━━━━━━━━
Banco: 197
Agência: 1
Conta: 31775638-5
Titular: Alexandra Arciniegas Gutierrez
━━━━━━━━━━━━━━━━━━━━━━

💻 Sistema: iFood
📊 Taxa Keeta: 12%
📊 Taxa iFood: 18%

📝 Observações: ...

━━━━━━━━━━━━━━━━━━━━━━
📅 Data: 22/08/2026, 16:58:00
```

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env`:
```
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
PORT=3000
```

## Como Obter as Configurações do Telegram

### 1. Criar o Bot e obter o Token

1. Abra o Telegram e procure por **@BotFather**
2. Inicie uma conversa e envie `/newbot`
3. Escolha um nome para o bot (ex: "Keeta Cadastro Bot")
4. Escolha um username que termine em "bot" (ex: "keeta_cadastro_bot")
5. O BotFather vai te enviar o **token** (algo como `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
6. Copie esse token e cole no `.env` na variável `TELEGRAM_BOT_TOKEN`

### 2. Obter o Chat ID do Grupo

**Opção A - Usando o bot @userinfobot:**
1. Adicione o bot **@userinfobot** ao seu grupo
2. Ele vai mostrar o ID do grupo (ex: `-1001234567890`)
3. Copie esse ID para o `.env` na variável `TELEGRAM_CHAT_ID`

**Opção B - Usando seu próprio bot:**
1. Adicione o bot que você criou ao grupo
2. Envie uma mensagem no grupo
3. Acesse no navegador: `https://api.telegram.org/botSEU_TOKEN/getUpdates`
4. Procure pelo campo `"chat":{"id":-100...` - esse número é o Chat ID

## Como Usar

### Iniciar o servidor

```bash
npm start
```

O servidor vai iniciar em `http://localhost:3000`

### Endpoint Principal

**POST** `/api/enviar-cadastro`

Envie os dados do formulário no corpo da requisição (JSON):

```json
{
  "idCliente": "51137965",
  "vendedor": "Heraclito",
  "restaurante": "Santa Arepa",
  "razaoSocial": "Alexandra Arciniegas Gutierrez",
  "proprietario": "Alexandra",
  "telProprietario": "(48) 98866-9947",
  "telLoja": "(48) 8880-3367",
  "cnpj": "60.453.207/0001-43",
  "cpf": "802.448.169-30",
  "banco": "197",
  "agencia": "1",
  "conta": "31775638-5",
  "titular": "Alexandra Arciniegas Gutierrez",
  "sistema": "iFood",
  "taxaKeeta": "12%",
  "taxaIfood": "18%",
  "observacoes": "Cliente indicado pela agência parceira"
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Cadastro enviado com sucesso para o Telegram!",
  "telegramMessageId": 123
}
```

### Resposta de Erro

```json
{
  "success": false,
  "message": "Campos obrigatórios faltando: restaurante, cnpj",
  "error": "..."
}
```

## Integração com o Formulário

No seu formulário HTML/Netlify, você pode fazer a requisição assim:

```javascript
// Exemplo com fetch
fetch('https://sua-api.com/api/enviar-cadastro', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    restaurante: document.getElementById('restaurante').value,
    cnpj: document.getElementById('cnpj').value,
    // ... outros campos
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    alert('Cadastro enviado com sucesso!');
  } else {
    alert('Erro: ' + data.message);
  }
});
```

## Deploy

Para colocar a API online, você pode usar:

- **Railway** (gratuito): railway.app
- **Render** (gratuito): render.com
- **Heroku** (pago)
- **VPS** (DigitalOcean, AWS, etc.)

### Deploy no Railway (recomendado)

1. Crie uma conta em railway.app
2. Conecte seu repositório GitHub
3. Adicione as variáveis de ambiente (`TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`)
4. O Railway vai fazer o deploy automaticamente

## Campos Suportados

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| idCliente | string | Não | ID do cliente no sistema |
| vendedor | string | Não | Nome do vendedor |
| restaurante | string | Sim | Nome do restaurante |
| razaoSocial | string | Não | Razão social da empresa |
| proprietario | string | Sim | Nome do proprietário |
| telProprietario | string | Não | Telefone do proprietário |
| telLoja | string | Não | Telefone da loja |
| cnpj | string | Sim | CNPJ da empresa |
| cpf | string | Não | CPF do proprietário |
| banco | string | Não | Código do banco |
| agencia | string | Não | Número da agência |
| conta | string | Não | Número da conta |
| titular | string | Não | Nome do titular da conta |
| sistema | string | Não | Sistema de PDV (iFood, etc.) |
| taxaKeeta | string | Não | Taxa de comissão Keeta |
| taxaIfood | string | Não | Taxa de comissão iFood |
| observacoes | string | Não | Observações adicionais |

## Licença

ISC
