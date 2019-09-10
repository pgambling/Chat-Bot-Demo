const { translateText } = require('../translate-text');

function initIntentHook(event) {
  const sessionAttributes =  event.sessionAttributes || {};
    // hack to pass through free text input for translation

  return {
      dialogAction: {
        type: "ElicitSlot",
        intentName: event.currentIntent.name,
        slots: {
            textToTranslate: sessionAttributes.promptedForText ? event.inputTranscript : null
        },
        slotToElicit: "textToTranslate",
      },
      sessionAttributes: {
        promptedForText: !sessionAttributes.promptedForText
      }
  };
}

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  if (event.invocationSource === 'DialogCodeHook') return initIntentHook(event);

  const translatedText = await translateText(event.currentIntent.slots.textToTranslate) || 'Already in English';

  const response = {
    dialogAction: {
      type: "Close",
      fulfillmentState: "Fulfilled"
    }
  };

  if (translatedText) {
    response.dialogAction.message = {
      contentType: "PlainText",
      content: translatedText
    };
  }

  return response;
};
