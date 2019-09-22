const { close, plainTextMessage } = require("./lex-helpers");
const { searchForMeme, createMeme } = require("../meme-api");

module.exports.handler = async event => {
  console.log(JSON.stringify(event));
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
