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

module.exports = {
  sendTextToLexBot
};
