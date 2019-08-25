const AWS = require('aws-sdk')
const { sendDirectMessage } = require('../twitter-api');

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
  const { senderId, screenName, text } = JSON.parse(event.Records[0].Sns.Message);
  console.log(`Received "${text}" from @${screenName}`);

  const replyText = await sendTextToLexBot(senderId, text);
  if (!replyText || replyText.length === 0) return;

  try {
    const response = await sendDirectMessage(senderId, replyText);
    console.log(`Succesfully sent reply to @${screenName}`);
    console.log(response);
  } catch (err) {
    console.error('Cannot send direct message');
    console.error(err);
  }
};
