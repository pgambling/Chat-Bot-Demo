const { close, confirmIntent, plainTextMessage } = require("./lex-helpers");

module.exports.handler = async event => {
  console.log(JSON.stringify(event));
  const { memeLabel, memeName, imgUrl } = event.sessionAttributes || {};

  if (!memeLabel || !memeName || !imgUrl) {
    return close(event, {
      fulfillmentState: "Fulfilled",
      message: plainTextMessage("You haven't created any memes recently")
    });
  }

  const msg = `You made a "${memeLabel}" meme last time, ${imgUrl}. Do you want to create another one like this?`;
  const response =  confirmIntent(event, 'CreateMeme', msg);

  response.dialogAction.slots = {
    memeName
  };

  return response;
};