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
  //get all the bids related the user id in the request and group them by auction art 
  const user_id = JSON.parse(req.payload).user_id
  const user_bids = await database.listDocuments('smart_auction', 'bid', [
    sdk.Query.equal('user_id', user_id),
    sdk.Query.orderDesc('$createdAt')
  ]);
  //
  // group the bids by auction art
  const bids_by_art = await Promise.all(user_bids.documents.map( async bid => {
    return {
      artist_name: await getArtistName(bid.auction_art.art.$id,database),
      art_name: bid.auction_art.art.name,
      art_id: bid.auction_art.art.$id,
      auction: bid.auction_art.auction.name,
      auction_id: bid.auction_art.auction.$id,
      auction_art_id: bid.auction_art.$id,
      auction_art_lot: bid.auction_art.lot,
      bid: bid.amount,
      date: bid.$createdAt,
      win_status: getBidStatus(bid),
      high_bid: bid.auction_art.high_bid.length > 0 ? [bid.auction_art.high_bid[0]] : null,
      status: bid.status,
    }
  }));
  const last_bids = bids_by_art.reduce((acc, bid) => {
    if (!acc[bid.art_id]) {
      acc[bid.art_id] = bid;
    }
    return acc;
  }, {});
  //convert last_bids to array
  const last_bids_arr = Object.keys(last_bids).map(key => last_bids[key]);
  res.json(last_bids_arr);
};
function getBidStatus(bid) {
  if (bid.auction_art.high_bid.length > 0) {
    if (bid.$id == bid.auction_art.high_bid[0].$id) {
      return bid.auction_art.status == 'closed' ? 'win' : 'highest';
    } else {
      return 'lost';
    }
  } else {
    return 'lost';
  }
}
async function getArtistName(artId,database) {
  //get art doc
  const art = await database.getDocument('smart_auction', 'art', artId);
  //artist is an array of artist objects, their name is artist.name, join them with comma
  const artist_names = art.artist.map(artist => artist.name);
  //check for null
  if (artist_names.length == 0) {
    return '';
  }
  return artist_names.join(', ');
}