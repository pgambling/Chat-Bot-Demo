const AWS = require("aws-sdk");
const request = require("request-promise-native");

const NO_OP_RESPONSE = { statusCode: 204 };

async function sendTextToLexBot(userId, inputText) {
  console.log("Sending message to Lex");
  try {
    const params = {
      botAlias: process.env.LEX_BOT_ALIAS,
      botName: process.env.LEX_BOT_NAME,
      inputText,
      userId
    };

    const lex = new AWS.LexRuntime();
    const response = await lex.postText(params).promise();
    console.log("Got a response from Lex bot");
    console.log(response);

    return response;
  } catch (err) {
    console.error("Failed to get response from Lex");
    console.error(err);
  }
}

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

async function canariasEasterEgg(chatId, messageId) {
  const imgUrl = "https://i.imgflip.com/3eo1vd.jpg";

  await request({
    method: "POST",
    uri: `https://api.telegram.org/bot${process.env.TELEGRAM_API_TOKEN}/deleteMessage`,
    body: {
      chat_id: chatId,
      message_id: messageId
    },
    json: true
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      chat_id: chatId,
      method: "sendPhoto",
      photo: imgUrl,
      message: imgUrl
    })
  };
}

function convertLexReplyToTelegram(chatId, lexReply) {
  let responseBody = {
    chat_id: chatId
  };

  const { message, responseCard } = lexReply;

  if (message && responseCard) {
    const { imageUrl, buttons } = responseCard.genericAttachments[0] || {};
    if (imageUrl) {
      responseBody.method = "sendPhoto";
      responseBody.photo = imageUrl;
      responseBody.caption = message;
    } else if (buttons && buttons.length > 0) {
      responseBody.method = "sendMessage";
      responseBody.text = message;
      responseBody.reply_markup = {
        keyboard: [buttons.map(b => ({ text: b.text }))],
        one_time_keyboard: true
      };
    }
  } else {
    responseBody.method = "sendMessage";
    responseBody.text = message;
    responseBody.reply_markup = { remove_keyboard: true };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  };
}

function welcomeMessage(chatId, user) {
  const responseBody = {
    chat_id: chatId,
    method: "sendMessage",
    text: `Hi ${user.first_name}, I'm a bot who loves to create memes for people. To get started, just say "I want to make a meme"`
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responseBody)
  };
}

exports.handler = async function(event) {
  console.log(event.body);
  const body = JSON.parse(event.body);

  if (!body.message) return NO_OP_RESPONSE;

  const { from, chat, text, message_id } = body.message;

  try {
    if (!text) return NO_OP_RESPONSE;

    console.log(`Received "${text}" from ${from.username} in chat ${chat.id}`);

    if (text === "/start") {
      console.log(`Sending welcome message to ${from.username}`);
      return welcomeMessage(chat.id, from);
    }

    if (text === "/easteregg") {
      return await canariasEasterEgg(chat.id, message_id);
    }

    // concatenating the user and chat ids so Lex can distinguish between seperate conversations
    const senderId = `telegram-${from.id}-${chat.id}`;
    const lexReply = await sendTextToLexBot(senderId, text);

    const telegramResponse = convertLexReplyToTelegram(chat.id, lexReply);
    console.log("Sending response to telegram");
    console.log(JSON.stringify(telegramResponse));

    return telegramResponse;
  } catch (err) {
    console.log(err);
    // return something in case of error so Telegram doesn't keep sending the same update
    return message(chat.id, "I don't feel right");
  }
};
