const crypto = require('crypto');

const createChallengeResponse = (consumerSecret, crcToken) => {
  return 'sha256=' + crypto.createHmac('sha256', consumerSecret).update(crcToken).digest('base64');
};

exports.handler = async function(event) {
  console.log('Received Event: ', event);
  console.log('crc_token = ', event.queryStringParameters.crc_token);
  const body = JSON.stringify({
    "response_token": createChallengeResponse(
      process.env.TWITTER_CONSUMER_API_SECRET_KEY,
      event.queryStringParameters.crc_token
    )
  });
  console.log('Sending response: ', body);
  return  {
    statusCode: 200,
    body,
  };
}
