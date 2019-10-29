const {
  elicitSlot,
  delegate,
  close,
  plainTextMessage,
  imageResponseCard
} = require("./lex-helpers");
const { searchForMeme, createMeme, currentMemeList } = require("../meme-api");

const FREE_TEXT_SLOTS = ["topText", "bottomText"];

/**
 * Lex sometimes trims off leading and trailing punctuation from elict slot actions. This overrides that slot
 * by replacing it with the full input transcript from the event.
 */
function fixFreeTextInput(previousIntent, inputTranscript, slots) {
  const slotToElicit = previousIntent.slotToElicit;

  if (!inputTranscript) return slots;
  if (!FREE_TEXT_SLOTS.includes(slotToElicit)) return slots;

  return { ...slots, [slotToElicit]: inputTranscript };
}

async function dialogCodeHook(event) {
  const { inputTranscript, recentIntentSummaryView } = event;
  const previousIntent = (recentIntentSummaryView || [])[0] || {};

  // check if user is coming in from a confirm intent action that they denied
  if (
    previousIntent.dialogActionType === "ConfirmIntent" &&
    event.currentIntent.confirmationStatus === "Denied"
  ) {
    return close(event, {
      fulfillmentState: "Fulfilled",
      message: plainTextMessage("Ok")
    });
  }

  let slots = event.currentIntent.slots || {};
  if (previousIntent.dialogActionType === "ElicitSlot") {
    slots = fixFreeTextInput(previousIntent, inputTranscript, slots);
  }

  const { memeName, textPlacement, topText, bottomText } = slots;

  let response = delegate(event);
  if (!memeName || !textPlacement) {
    if (memeName && memeName.indexOf(":") === -1) {
      // haven't validated this meme yet
      const meme = await searchForMeme(memeName);

      if (!meme) {
        slots.memeName = null;
        const topMemes = currentMemeList()
          .slice(0, 3)
          .map(m => m.name)
          .join("\n");
        response = elicitSlot(
          event,
          "memeName",
          `I didn't find a ${memeName} meme, but the top 3 memes I found are:\n${topMemes}\nTell me again what meme you want to use?`
        );
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

  const [memeLabel, memeId] = memeName.split(":");

  const imgUrl = await createMeme(memeId, topText, bottomText);

  if (!imgUrl) {
    return close(event, {
      fulfillmentState: "Failed",
      message: plainTextMessage("Something went wrong...")
    });
  }

  const fulfilledResponse = close(event, {
    fulfillmentState: "Fulfilled",
    message: plainTextMessage(imgUrl),
    responseCard: imageResponseCard(imgUrl)
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
  return (await event.invocationSource) === "DialogCodeHook"
    ? dialogCodeHook(event)
    : fulfillment(event);
};
