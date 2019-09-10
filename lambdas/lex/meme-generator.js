const {
  elicitSlot,
  confirmIntent,
  delegate,
  close,
  plainTextMessage,
  imageResponseCard
} = require("./lex-helpers");

const { searchForMeme, createMeme } = require("../meme-api");

function dialogCodeHook(event) {
  let slots = { ...(event.currentIntent.slots || {}) };

  const confirmationStatus = event.currentIntent.confirmationStatus;
  let answeredIncludeTopText = slots.includeTopText != null;
  let answeredIncludeBottomText = slots.includeBottomText != null;

  // check if the user is responding to a confirmation question
  if (confirmationStatus !== "None") {
    const isConfirmed = confirmationStatus === "Confirmed" ? "yes" : "no";
    // manually setting the yes/no question answers with confirmation status because it handles a larger sample of
    // answers to a yes/no question then using custom slot type
    if (!answeredIncludeTopText) {
      slots.includeTopText = isConfirmed;
      answeredIncludeTopText = true;
    } else if (!answeredIncludeBottomText) {
      slots.includeBottomText = isConfirmed;
      answeredIncludeBottomText = true;
    }
  }

  const {
    memeName,
    includeTopText,
    topText,
    includeBottomText,
    bottomText
  } = slots;

  let response;
  if (
    memeName &&
    (includeTopText === "no" || topText) &&
    (includeBottomText === "no" || bottomText)
  ) {
    // Delegate back to Lex once all the required slots are filled
    response = delegate(event);
  } else if (!memeName) {
    response = elicitSlot(event, "memeName");
  } else if (!answeredIncludeTopText) {
    response = confirmIntent(event, "Do you want to include text on top?");
  } else if (includeTopText === "yes" && !topText) {
    response = elicitSlot(event, "topText");
  } else if (!answeredIncludeBottomText) {
    response = confirmIntent(event, "Do you want to include text on bottom?");
  } else if (includeBottomText === "yes" && !bottomText) {
    response = elicitSlot(event, "bottomText");
  }

  response.dialogAction.slots = slots;

  return response;
}

module.exports.handler = async event => {
  console.log(JSON.stringify(event));

  // handle initialization and validation events
  if (event.invocationSource === "DialogCodeHook") return dialogCodeHook(event);

  // Fulfillment
  const { memeName, topText, bottomText } = event.currentIntent.slots;

  const meme = await searchForMeme(memeName);

  if (!meme) {
    // Handle no match
    // TODO: Suggest alternatives?
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

  return close(event, {
    fulfillmentState: "Fulfilled",
    message: plainTextMessage("Here you go"),
    responseCard: imageResponseCard(imgUrl)
  });
};
