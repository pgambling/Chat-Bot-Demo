const { sendDirectMessage } = require('../twitter-api');

exports.handler = async function (event) {
  const { senderId, screenName, text } = JSON.parse(event.Records[0].Sns.Message);
  console.log(`Received "${text}" from @${screenName}`);

  try {
    const response = await sendDirectMessage(senderId, `You said "${text}"`);
    console.log(`Succesfully sent message to @${screenName}`);
    console.log(response);
  } catch (err) {
    console.error('Cannot send direct message');
    console.error(err);
  }
};
