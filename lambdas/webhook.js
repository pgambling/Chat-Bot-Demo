const AWS = require('aws-sdk');

const lex = new AWS.LexRuntime();

const { LEX_BOT_NAME, LEX_BOT_ALIAS } = process.env;

async function sendTextToLexBot(userId, inputText) {
  console.log('Sending message to Lex');
  try {
    const params = {
      botAlias: LEX_BOT_ALIAS,
      botName: LEX_BOT_NAME,
      inputText,
      userId
    };

    const response = await lex.postText(params).promise();
    console.log('Got a response from Lex bot');
    console.log(response);

    return response.message;
  } catch (err) {
    console.error('Failed to get response from Lex');
    console.error(err);
  }
}

exports.handler = async function (event) {
  const NO_OP_RESPONSE = { statusCode: 204 };
  const body = JSON.parse(event.body);

  if (!body.message) return NO_OP_RESPONSE;

  const { from, chat, text } = body.message;

  if (!text || text === '/start') return NO_OP_RESPONSE; // TODO: Respond to /start

  console.log(`Received "${text}" from ${from.username} in chat ${chat.id}`);

  // concatenating the user and chat ids so Lex can distinguish between seperate conversations
  const senderId = `${from.id}-${chat.id}`;
  const replyText = await sendTextToLexBot(senderId, text);
  
  if (!replyText || replyText.length === 0) return NO_OP_RESPONSE;

  const responseBody = {
    method: 'sendMessage',
    chat_id: chat.id,
    text: replyText
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  }
};


