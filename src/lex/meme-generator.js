const {
  elicitSlot,
  delegate,
  close,
  plainTextMessage
} = require("./lex-helpers");
const { searchForMeme, createMeme } = require("../meme-api");

async function dialogCodeHook(event) {
  const slots = event.currentIntent.slots || {};
  const { memeName, textPlacement, topText, bottomText } = slots;

  let response;
  if (!memeName || !textPlacement) {
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
    return close(event, {
      fulfillmentState: "Failed",
      message: plainTextMessage(`I couldn't find a match for "${memeName}"`)
    });
  }

  const imgUrl = await createMeme(meme.id, topText, bottomText);

  if (!imgUrl) {
    return close(event, {
      fulfillmentState: "Failed",
      message: plainTextMessage("Something went wrong...")
    });
  }

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
