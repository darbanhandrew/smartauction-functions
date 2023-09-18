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
  // This function is called when a bid is inserted in the bids collection.
  // It checks if the bid is greater than the current price of the auction_art 
  // and if it is we are setting the bid status to accepted
  // and if it is not we are setting the bid status to rejected
  // and we are updating the bid document in the database
  // and we are updating the auction_art document in the databases

  //get event data req.variables 
  const event_data = JSON.parse(req.variables["APPWRITE_FUNCTION_EVENT_DATA"]);

  let bid = await database.getDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id);
  // there should be multiple validations on a bid and the result will be stored in  bid.status 
  // for now we are just checking if the bid is greater than the current price of the auction_art 
  // and if it is we are setting the bid status to accepted
  // and if it is not we are setting the bid status to rejected
  // and we are updating the bid document in the database
  // and we are updating the auction_art document in the database
  //also check if the bid is created in auction_art.auction_start_date and auction_art.auction_end_date
  if (bid.amount > bid.auction_art.current_price && Date(bid.auction_art.auction_start_date) <= Date(bid.$createdAt) && Date(bid.auction_art.auction_end_date) >= Date(bid.$createdAt)) {
    const new_auction_art = await database.updateDocument(bid.auction_art.$databaseId, bid.auction_art.$collectionId, bid.auction_art.$id,
      {
        "current_price": bid.amount,
        "number_of_bids": bid.auction_art.number_of_bids + 1,
        "high_bid": [bid.$id],
      });
    const newbid = await database.updateDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id,
      {
        "status": "accepted"
      }
    );
    res.json({
      "bid": newbid,
      "status": "accepted",
    })
  }
  else {
    const newbid = await database.updateDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id, {
      "status": "rejected"
    });
    res.json({
      "bid": newbid,
      "status": "rejected"
    });
  }



};
