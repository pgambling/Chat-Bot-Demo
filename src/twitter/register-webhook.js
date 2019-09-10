const { registerWebhook } = require('../twitter-api');

exports.handler = async function() {
  try {
    const response = await registerWebhook(process.env.WEBHOOK_URL)
    console.log('Succesfully registered webhook');
    console.log(response);
  } catch (err) {
    console.error('Cannot register webhook');
    console.error(err);
  }
};
