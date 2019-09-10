const request = require('request-promise-native');

function getRequestOptions(url) {
  const {
    TWITTER_CONSUMER_API_KEY,
    TWITTER_CONSUMER_API_SECRET_KEY,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
    TWITTER_URL_BASE
  } = process.env;

  return {
    url: `${TWITTER_URL_BASE}/${url}`,
    oauth: {
      consumer_key: TWITTER_CONSUMER_API_KEY,
      consumer_secret: TWITTER_CONSUMER_API_SECRET_KEY,
      token: TWITTER_ACCESS_TOKEN,
      token_secret: TWITTER_ACCESS_TOKEN_SECRET,
    },
    resolveWithFullResponse: true
  }
}

function registerWebhook(url) {
  const requestOptions = getRequestOptions(
    `account_activity/all/${process.env.ENV_NAME}/webhooks.json?url=${encodeURIComponent(url)}`
  );
  return request.post(requestOptions);
}

function registerSubscription() {
  const requestOptions = getRequestOptions(`account_activity/all/${process.env.ENV_NAME}/subscriptions.json`);
  return request.post(requestOptions);
}

function followUser(userId) {
  const requestOptions = getRequestOptions(`friendships/create.json?user_id=${userId}`);
  return request.post(requestOptions);
}

function unfollowUser(userId) {
  const requestOptions = getRequestOptions(`friendships/destroy.json?user_id=${userId}`);
  return request.post(requestOptions);
}

function sendDirectMessage(userId, text) {
  const body = {
    event: {
      type: "message_create",
      message_create: {
        target: {
          recipient_id: userId
        },
        message_data: {
          text
        }
      }
    }
  };
  const requestOptions = getRequestOptions(`direct_messages/events/new.json`);
  requestOptions.json = true;
  requestOptions.body = body;
  return request.post(requestOptions);
}

module.exports = {
  registerWebhook,
  registerSubscription,
  followUser,
  unfollowUser,
  sendDirectMessage,
  FOLLOW_EVENT_TYPE: 'follow',
  UNFOLLOW_EVENT_TYPE: 'unfollow'
};
