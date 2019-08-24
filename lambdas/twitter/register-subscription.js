const { registerSubscription } = require('../twitter-api');

exports.handler = async function() {
  try {
    const response = await registerSubscription();
    console.log('Succesfully subscribed to account activity');
    console.log(response);
  } catch (err) {
    console.error('Cannot subscribe to account activity');
    console.error(err);
  }
};
