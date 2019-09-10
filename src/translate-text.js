const AWS = require('aws-sdk');

async function translateText (text, targetLanguageCode = 'en') {
  const translate = new AWS.Translate();
  const comprehend = new AWS.Comprehend();
  const comprehendResp = await comprehend.detectDominantLanguage({ Text: text }).promise();

  if (comprehendResp.Languages.length === 0) return "I couldn't detect the language";
  
  comprehendResp.Languages.forEach(lang => {
    console.log(`Detected language ${lang.LanguageCode} with a score of ${lang.Score}`); 
  });

  const { LanguageCode } = comprehendResp.Languages[0];

  if (LanguageCode === targetLanguageCode) return;

  const translateResp = await translate.translateText({
    SourceLanguageCode: LanguageCode,
    TargetLanguageCode: targetLanguageCode,
    Text: text
  }).promise();

  return translateResp.TranslatedText;
};

module.exports = {
  translateText
};
