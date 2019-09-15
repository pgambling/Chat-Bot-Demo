const { close, plainTextMessage } = require("./lex-helpers");
const { getUser } = require("../db");

module.exports.handler = async event => {
  console.log(event);
  // default number of requested memes to 2 if not provided
  let { requestedNumber } = event.currentIntent.slots;
  requestedNumber = requestedNumber || 2;

  const user = await getUser(event.userId);

  if (!user) {
    return close(event, {
      fulfillmentState: "Fulfilled",
      message: plainTextMessage(
        "Looks like you haven't created a meme yet. Tell me what kind of meme you want."
      )
    });
  }

  const { memes } = user;
  let responseText;
  if (memes.length < requestedNumber) {
    responseText = `You only have ${memes.length} that I know about. Here they are. `;
  } else {
    responseText = `Here are the last ${requestedNumber} memes you created. `;
  }

  // TODO: Send multiple images in a response card
  responseText += memes
    .slice(0, requestedNumber)
    .map(m => m.imgUrl)
    .join("\n");

  return close(event, {
    fulfillmentState: "Fulfilled",
    message: plainTextMessage(responseText)
  });
};
