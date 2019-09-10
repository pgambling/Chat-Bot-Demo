module.exports.handler = async (event) => {
  return {
    "dialogAction": {
      "type": "Close",
      "fulfillmentState": "Fulfilled",
      "message": {
        "contentType": "PlainText",
        "content": new Date().toString()
      }
    }
  };
};
