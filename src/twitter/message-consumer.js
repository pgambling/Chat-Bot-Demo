const { sendTextToLexBot } = require('../lex-api');
const { sendDirectMessage } = require('../twitter-api');

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
