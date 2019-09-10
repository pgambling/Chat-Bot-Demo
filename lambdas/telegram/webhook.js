const { sendTextToLexBot } = require("../lex-api");
const { translateText } = require("../translate-text");

const NO_OP_RESPONSE = { statusCode: 204 };

function message(chatId, text) {
  if (!text || text.length === 0) return NO_OP_RESPONSE;

  const responseBody = {
    method: "sendMessage",
    chat_id: chatId,
    text
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  };
}

function convertLexReplyToTelegram(chatId, lexReply) {
  let responseBody = {
    chat_id: chatId
  };

  const { message, responseCard } = lexReply;

  if (message && responseCard) {
    // Naively assuming image response card right now (should probably create a custom return type)
    // also just merging the closing message and image together, but will need to be able to respond with multiple images
    responseBody.method = "sendPhoto";
    responseBody.photo = responseCard.genericAttachments[0].imageUrl;
    responseBody.caption = message;
  } else {
    responseBody.method = "sendMessage";
    responseBody.text = message;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  };
}

exports.handler = async function(event) {
  console.log(event.body);
  const body = JSON.parse(event.body);

  if (!body.message) return NO_OP_RESPONSE;

  const { from, forward_date, chat, text } = body.message;

  try {
    if (!text || text === "/start") return NO_OP_RESPONSE; // TODO: Respond to /start

    if (forward_date && text) {
      console.log(
        `Received forwarded message "${text}" from ${from.username} in chat ${chat.id}`
      );
      const translatedText = await translateText(text);
      return message(chat.id, translatedText);
    }

    console.log(`Received "${text}" from ${from.username} in chat ${chat.id}`);

    // concatenating the user and chat ids so Lex can distinguish between seperate conversations
    const senderId = `${from.id}-${chat.id}`;
    const lexReply = await sendTextToLexBot(senderId, text);

    return convertLexReplyToTelegram(chat.id, lexReply);
  } catch (err) {
    // return something in case of error so Telegram doesn't keep sending the same update
    return message(chat.id, "I don't feel right");
  }
};
