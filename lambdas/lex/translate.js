const { translateText } = require('../translate-text');

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  if (event.invocationSource === 'DialogCodeHook') {
    // TODO: I think need to expect to handle the initial intent prompt as well and return an elicit slot?
    // hack to pass through free text input for translation
    return {
      dialogAction: {
        type: "Delegate",
        slots: {
           textToTranslate: event.inputTranscript,
        }
      }
    };
  }
  else {
    const translatedText = await translateText(event.currentIntent.slots.textToTranslate);

    return {
      dialogAction: {
        type: "Close",
        fulfillmentState: "Fulfilled",
        message: {
          contentType: "PlainText",
          content: translatedText
        }
      }
    };
  }
};
