const sdk = require("node-appwrite");

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
*/

module.exports = async function (req, res) {
  const client = new sdk.Client();

  // You can remove services you don't use
  const account = new sdk.Account(client);
  const avatars = new sdk.Avatars(client);
  const database = new sdk.Databases(client);
  const functions = new sdk.Functions(client);
  const health = new sdk.Health(client);
  const locale = new sdk.Locale(client);
  const storage = new sdk.Storage(client);
  const teams = new sdk.Teams(client);
  const users = new sdk.Users(client);

  if (
    !req.variables['APPWRITE_FUNCTION_ENDPOINT'] ||
    !req.variables['APPWRITE_FUNCTION_API_KEY']
  ) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    client
      .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
  }
  try {
    const payload = JSON.parse(req.payload);
    let auction_art = await database.getDocument('smart_auction', 'auction_art', payload.$id);
    //get all aucion_arts for this auction and sort them by field order which is an integer
    let auction = await database.getDocument('smart_auction', 'auction', auction_art.auction.$id);
    //auction has a lsit of auction_art objects. We need to sort them by order field which is an integer 
    auction.auction_art.sort((a, b) => (a.order > b.order) ? 1 : -1);
    //replace the auction_art auction object with the auction object
    auction_art.auction = auction;
    //create two new fields, next_auction_art and previous_auction_art
    let next_auction_art = null;
    let previous_auction_art = null;
    let current_auction_art_index = -1;
    for (let i = 0; i < auction.auction_art.length; i++) {
      if (auction.auction_art[i].$id == auction_art.$id) {
        current_auction_art_index = i;
        if (i > 0) {
          previous_auction_art = auction.auction_art[i - 1];
        }
        if (i < auction.auction_art.length - 1) {
          next_auction_art = auction.auction_art[i + 1];
        }
      }
      const new_auction_art = await database.getDocument('smart_auction', 'auction_art', auction.auction_art[i].$id);
      auction.auction_art[i]=new_auction_art;
    }
    auction_art.next_auction_art = next_auction_art;
    auction_art.previous_auction_art = previous_auction_art;
    auction_art.auction.auction_art.splice(current_auction_art_index, 1);
    res.json(auction_art);
  } catch (error) {
    console.error(error);
    res.json({
      error: error,
    });
  }
};
