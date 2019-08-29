const { sendTextToLexBot } = require('../lex-api');

const NO_OP_RESPONSE = { statusCode: 204 };

exports.handler = async function (event) {
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


