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
    let auction = await database.getDocument('smart_auction', 'auction', payload.$id);
    if (payload.sort === 'asc_current_price') {
      auction.auction_art.sort((a, b) => a.current_price - b.current_price);
    } else if (payload.sort === 'desc_current_price') {
      auction.auction_art.sort((a, b) => b.current_price - a.current_price);
    } else if (payload.sort === 'asc_lot') {
      auction.auction_art.sort((a, b) => a.lot - b.lot);
    }
    else if (payload.sort === 'desc_lot') {
      auction.auction_art.sort((a, b) => b.lot - a.lot);
    }
    else if (payload.sort === 'asc_bid_count') {
      auction.auction_art.sort((a, b) => a.number_of_bids - b.number_of_bids);
    }
    else if (payload.sort === 'desc_bid_count') {
      auction.auction_art.sort((a, b) => b.number_of_bids - a.number_of_bids);
    }
    

    if (payload.filters) {
      if (payload.filters?.user_has_bid) {
        auction.auction_art = auction.auction_art.filter((art) => {
          return art.bid.some((bid) => bid.user_id === payload.filters.user_has_bid);
        });
      }
      if (payload.filters?.status === 'closed') {
        auction.auction_art = auction.auction_art.filter((art) => {
          return art.status === 'closed';
        });
      }
      if (payload.filters?.start_price != null && payload.filters?.end_price != null) {
        auction.auction_art = auction.auction_art.filter((art) => {
          return art.start_price >= payload.filters.start_price && art.start_price <= payload.filters.end_price;
        });
      } else if (payload.filters?.start_price != null) {
        auction.auction_art = auction.auction_art.filter((art) => {
          return art.start_price >= payload.filters.start_price;
        });
      } else if (payload.filters?.end_price != null) {
        auction.auction_art = auction.auction_art.filter((art) => {
          return art.start_price <= payload.filters.end_price;
        });
      }
    }
    for (let i = 0; i < auction.auction_art.length; i++) {
      if (auction.auction_art[i].art) {
        const art = await database.getDocument('smart_auction', 'art', auction.auction_art[i].art.$id);
        //remove auction_art field from art 
        delete art.auction_art;
        //filter by artist_name if payload.filters.artist_name is not null
        if (payload.filters?.artist_name) {
          if (art.artist.   name.toLowerCase().includes(payload.filters.artist_name.toLowerCase())) {
            auction.auction_art[i].art = art;
          } else {
            auction.auction_art.splice(i, 1);
            i--;
            continue;
          }
        }
        else {
          auction.auction_art[i].art = art;
        }
      }
    }
    delete auction.user_auction_request;
    res.json(auction);
  } catch (error) {
    console.error(error);
    res.json({
      error: error,
    });
  }
};
