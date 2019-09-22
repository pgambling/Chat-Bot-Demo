const {
  elicitSlot,
  delegate,
  close,
  plainTextMessage
} = require("./lex-helpers");
const { searchForMeme, createMeme, currentMemeList } = require("../meme-api");

async function dialogCodeHook(event) {
  // check if user is coming in from a confirm intent action that they denied
  if (event.currentIntent.confirmationStatus === "Denied") {
    return close(event, {
      fulfillmentState: "Fulfilled",
      message: plainTextMessage("Ok")
    });
  }

  const slots = event.currentIntent.slots || {};
  const { memeName, textPlacement, topText, bottomText } = slots;
  
  let response = delegate(event);
  if (!memeName || !textPlacement) {
    if (memeName && memeName.indexOf(':') === -1) { // haven't validated this meme yet
      const meme = await searchForMeme(memeName);

      if (!meme) {
        slots.memeName = null;
        const topMemes = currentMemeList().slice(0, 3).map(m => m.name).join('\n');
        response =  elicitSlot(
          event,
          "memeName",
          `I didn't find a ${memeName} meme, but the top 3 memes I found are:\n${topMemes}\nTell me again what meme you want to use?`);
      } else {
        slots.memeName = `${meme.name}:${meme.id}`;
      }
    } else {
      response = delegate(event);
    }
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

  const [memeLabel, memeId] = memeName.split(':');

  const imgUrl = await createMeme(memeId, topText, bottomText);

  if (!imgUrl) {
    return close(event, {
      fulfillmentState: "Failed",
      message: plainTextMessage("Something went wrong...")
    });
  }

  const fulfilledResponse = close(event, {
    fulfillmentState: "Fulfilled",
    message: plainTextMessage(imgUrl)
  });

  // track this last successfully created meme in case user wants to use it again right away
  fulfilledResponse.sessionAttributes = { 
    memeLabel,
    memeName,
    imgUrl,
    topText,
    bottomText
  };

  return fulfilledResponse;
}

module.exports.handler = async event => {
  console.log(JSON.stringify(event));
  return (await event.invocationSource === "DialogCodeHook"
    ? dialogCodeHook(event)
    : fulfillment(event));
};

