const { followUser, unfollowUser, FOLLOW_EVENT_TYPE, UNFOLLOW_EVENT_TYPE } = require('../twitter-api');
const AWS = require('aws-sdk')
const sns = new AWS.SNS()

const { TWITTER_MSG_TOPIC } = process.env;

async function processFollowEvents(body) {
  const followEvents = body.follow_events || [];

  if (followEvents.length === 0) return;

  console.log(`Processing ${followEvents.length} follow events`);

  for (let i in followEvents) {
    const { type, source } = followEvents[i];
    const userId = source.id;
    const screenName = source.screen_name;

    if (userId === process.env.TWITTER_BOT_USER_ID) {
      console.log('Skipping follow event from this bot');
      continue;
    }

    try {
      switch (type) {
        case FOLLOW_EVENT_TYPE:
          await followUser(userId);
          console.log(`Successfully followed @${screenName}`);
          break;
        case UNFOLLOW_EVENT_TYPE:
          await unfollowUser(userId);
          console.log(`Successfully unfollowed @${screenName}`);
          break;
        default:
          console.log(`Unrecognized follow event type ${type} for @${screenName}`);
          break;
      }
    } catch (err) {
      console.error(`Failed to ${type} @${screenName}`);
      console.error(err);
    }
  };
}

async function processDirectMessageEvents(body) {
  const messageEvents = body.direct_message_events || [];
  const users = body.users;
  
  console.log(`Processing ${messageEvents.length} direct message events`);

  for (let i in messageEvents) {
    const { sender_id, message_data } = messageEvents[i].message_create;

    if (sender_id === process.env.TWITTER_BOT_USER_ID)  continue;

    const screenName = users[sender_id].screen_name;
    const text = message_data.text;
    console.log(`Received the following text from ${screenName}: ${text}`)
    try {
      const response = await sns.publish({
        Message: JSON.stringify({ senderId: sender_id, screenName, text }),
        TopicArn: TWITTER_MSG_TOPIC
      }).promise();
      console.log(`Successfully posted message to ${TWITTER_MSG_TOPIC}, Message.Id = ${response.MessageId}`)
    } catch (err) {
      console.error(`Failed to post message to ${TWITTER_MSG_TOPIC}`);
      console.error(err);
    }
  }
}

exports.handler = async function(event) {
  // TODO: Verify twitter signature header
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  const body = JSON.parse(event.body);

  // Make sure these events are for this bot
  if (body.for_user_id !== process.env.TWITTER_BOT_USER_ID) {
    return { statusCode: 403, body: 'Invalid for_user_id' };
  }

  await processDirectMessageEvents(body);
  await processFollowEvents(body);
  
  return  { statusCode: 204 };
}
