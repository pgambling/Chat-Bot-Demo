const Fuse = require("fuse.js");
const request = require("request-promise-native");

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ["name"]
};

const canariasMeme = {
  "id": "146476669",
  "name": "canarias",  
}

// relying on warmed up lambda for quick and dirty request caching
let MEME_LIST;

function currentMemeList() {
  return MEME_LIST;
}

async function searchForMeme(query) {
  if (!MEME_LIST) {
    const response = await request({
      uri: "https://api.imgflip.com/get_memes",
      json: true
    });

    if (response.success) {
      MEME_LIST = [...response.data.memes, canariasMeme];
    }
  }

  // a shortcut to just retun a random selection
  if (query === 'random') {
    return MEME_LIST[Math.floor(Math.random() * MEME_LIST.length)];
  }

  const fuse = new Fuse(MEME_LIST, FUSE_OPTIONS);
  const result = fuse.search(query);

  if (result.length === 0) return null;

  return result[0];
}

async function createMeme(id, textTop, textBottom) {
  let imgflipOptions = {
    template_id: id,
    username: process.env.IMGFLIP_USERNAME,
    password: process.env.IMGFLIP_PASSWORD
  };

  if (textTop) {
    imgflipOptions.text0 = textTop;
  }

  if (textBottom) {
    imgflipOptions.text1 = textBottom;
  }

  const response = await request({
    method: "POST",
    uri: "https://api.imgflip.com/caption_image",
    form: imgflipOptions,
    json: true
  });

  if (!response.success) {
    console.log("Failed to create meme");
    console.log(JSON.stringify(response));
    return null;
  }

  return response.data.url;
}

module.exports = {
  searchForMeme,
  createMeme,
  currentMemeList
};
