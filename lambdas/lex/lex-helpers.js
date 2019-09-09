function plainTextMessage(message) {
  return {
    contentType: "PlainText",
    content: message
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

function elicitSlot(inputEvent, slotToElicit) {
  return createLexResponse(inputEvent, { type: "ElicitSlot", slotToElicit });
}

function confirmIntent(inputEvent, message) {
  return createLexResponse(inputEvent, {
    type: "ConfirmIntent",
    message: plainTextMessage(message)
  });
}

function delegate(inputEvent) {
  const response = createLexResponse(inputEvent, {
    type: "Delegate"
  });

  delete response.dialogAction.intentName; // for some reason Lex doesn't want intentName set on delegate responses

  return response;
}

module.exports = {
  elicitSlot,
  confirmIntent,
  delegate
};
