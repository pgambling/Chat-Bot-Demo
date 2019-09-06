const { sendTextToLexBot } = require('../lex-api');
const { translateText } = require('../translate-text');

const NO_OP_RESPONSE = { statusCode: 204 };

function message(chatId, text) {
  const responseBody = {
    method: 'sendMessage',
    chat_id: chatId,
    text
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  }
}

exports.handler = async function (event) {
  console.log(event.body);
  const body = JSON.parse(event.body);

  if (!body.message) return NO_OP_RESPONSE;

  const { from, forward_date, chat, text } = body.message;

  try {
    if (!text || text === '/start') return NO_OP_RESPONSE; // TODO: Respond to /start

    let replyText;
    if (forward_date && text) {
      console.log(`Received forwarded message "${text}" from ${from.username} in chat ${chat.id}`);
      replyText = await translateText(text);
    } else {
      console.log(`Received "${text}" from ${from.username} in chat ${chat.id}`);
      // concatenating the user and chat ids so Lex can distinguish between seperate conversations
      const senderId = `${from.id}-${chat.id}`;
      replyText = await sendTextToLexBot(senderId, text);
    }

    if (!replyText || replyText.length === 0) return NO_OP_RESPONSE;

    return message(chat.id, replyText);
  } catch (err) {
    // return something in case of error so Telegram doesn't keep sending the same update
    return message(chat.id, "I don't feel right");
  }
};


