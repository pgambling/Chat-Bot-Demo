function plainTextMessage(message) {
  return {
    contentType: "PlainText",
    content: message
  };
}

function imageResponseCard(imageUrl) {
  return {
    version: 1,
    contentType: "application/vnd.amazonaws.card.generic",
    genericAttachments: [
      {
        imageUrl
      }
    ]
  };
}

function createLexResponse(inputEvent, dialogActionArgs) {
  return {
    dialogAction: {
      ...dialogActionArgs,
      intentName: inputEvent.currentIntent.name,
      slots: inputEvent.slots
    },
    sessionAttributes: inputEvent.sessionAttributes
  };
}

function elicitSlot(inputEvent, slotToElicit, message) {
  const dialogActionCfg = { type: "ElicitSlot", slotToElicit };
  if (message) {
    dialogActionCfg.message = plainTextMessage(message);
  }
  return createLexResponse(inputEvent, dialogActionCfg);
}

function confirmIntent(inputEvent, intentName, message) {
  const response =  createLexResponse(inputEvent, {
    type: "ConfirmIntent",
    message: plainTextMessage(message)
  });

  response.dialogAction.intentName = intentName;

  return response;
}

function delegate(inputEvent) {
  const response = createLexResponse(inputEvent, {
    type: "Delegate"
  });

  delete response.dialogAction.intentName; // for some reason Lex doesn't want intentName set on delegate responses

  return response;
}

function close(inputEvent, closeArgs) {
  const response = createLexResponse(inputEvent, {
    ...closeArgs,
    type: "Close"
  });

  delete response.dialogAction.intentName; // for some reason Lex doesn't want intentName set on close responses

  return response;
}

module.exports = {
  elicitSlot,
  confirmIntent,
  delegate,
  close,
  plainTextMessage,
  imageResponseCard
};
