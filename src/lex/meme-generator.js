const {
  elicitSlot,
  delegate,
  close,
  plainTextMessage
} = require("./lex-helpers");
const { getUser, updateUser } = require("../db");
const { searchForMeme, createMeme } = require("../meme-api");

async function dialogCodeHook(event) {
  const slots = event.currentIntent.slots || {};
  const { memeName, textPlacement, topText, bottomText } = slots;

  // TODO: Validate memeName exists

  let response;
  if (!memeName || !textPlacement) {
    // prompt for meme name and text placement before asking user for text
    response = delegate(event);
  } else if (
    !topText &&
    (textPlacement === "both" || textPlacement === "top")
  ) {
    response = elicitSlot(event, "topText");
  } else if (
    !bottomText &&
    (textPlacement === "both" || textPlacement === "bottom")
  ) {
    response = elicitSlot(event, "bottomText");
  } else {
    // all slots filled in
    response = delegate(event);
  }

  response.dialogAction.slots = slots;

  return response;
}

async function fulfillment(event) {
  const { memeName, topText, bottomText } = event.currentIntent.slots;

  const meme = await searchForMeme(memeName);

  if (!meme) {
    // Handle no match
    // TODO: Suggest alternatives? Move this to validation
    return close(event, {
      fulfillmentState: "Failed",
      message: plainTextMessage(
        `I'm sorry, but I couldn't find a meme that matched ${memeName}`
      )
    });
  }

  const imgUrl = await createMeme(meme.id, topText, bottomText);

  if (!imgUrl) {
    return close(event, {
      fulfillmentState: "Failed",
      message: plainTextMessage("Something went wrong...")
    });
  }

  // store the last 30 memes created
  const user = (await getUser(event.userId)) || {
    memes: [],
    created: Date.now()
  };
  console.log(`Current user ${JSON.stringify(user)}`);
  user.memes = [{ imgUrl, created: Date.now() }, ...user.memes.slice(0, 4)];
  user.updated = Date.now();
  console.log(`Updated user ${JSON.stringify(user)}`);
  await updateUser(event.userId, user);

  return close(event, {
    fulfillmentState: "Fulfilled",
    message: plainTextMessage(imgUrl)
  });
}

module.exports.handler = async event => {
  console.log(JSON.stringify(event));
  return (await event.invocationSource) === "DialogCodeHook"
    ? dialogCodeHook(event)
    : fulfillment(event);
};
