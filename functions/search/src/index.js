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
  const database = new sdk.Databases(client);

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
    const searchTerm = payload.searchTerm;
    let auction_arts = await database.listDocuments('smart_auction', 'auction_art');
    let results = [];
    for (let i = 0; i < auction_arts.documents.length; i++) {
      const auction_art = auction_arts.documents[i];
      const auction_art_art_name = auction_art.art?.name?.toLowerCase();
      const auction_art_artist_name = auction_art.art?.artist?.name?.toLowerCase();
      const auction_art_auction_name = auction_art.auction?.name?.toLowerCase();
      if ((auction_art_art_name && auction_art_art_name.includes(searchTerm)) || (auction_art_artist_name && auction_art_artist_name.includes(searchTerm)) || (auction_art_auction_name && auction_art_auction_name.includes(searchTerm))) {
        results.push(auction_art);
      }
    }
    res.json(results);
  } catch (e) {
    res.send(e.message, 500);
  }
}
