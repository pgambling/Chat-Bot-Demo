const AWS = require('aws-sdk');

async function sendTextToLexBot(userId, inputText) {
  console.log('Sending message to Lex');
  try {
    const params = {
      botAlias: process.env.LEX_BOT_ALIAS,
      botName: process.env.LEX_BOT_NAME,
      inputText,
      userId
    };
    
    const lex = new AWS.LexRuntime();
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
