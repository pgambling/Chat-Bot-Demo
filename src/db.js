const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getUser(id) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id
    }
  };

  return (await dynamodb.get(params).promise()).Item;
}

function updateUser(id, data) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id,
      ...data
    }
  };

  return dynamodb.put(params).promise();
}

module.exports = { getUser, updateUser };
