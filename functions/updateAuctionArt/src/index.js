const sdk = require("node-appwrite");
const https = require('https');

module.exports = async function (req, res) {
  const { APPWRITE_FUNCTION_ENDPOINT, APPWRITE_FUNCTION_API_KEY, KAVENEGAR_URL, KAVENEGAR_API_TOKEN } = req.variables;

  if (!APPWRITE_FUNCTION_ENDPOINT || !APPWRITE_FUNCTION_API_KEY) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
    res.json({ "message": "Environment variables not set." });
    return;
  }

  const client = new sdk.Client()
    .setEndpoint(APPWRITE_FUNCTION_ENDPOINT)
    .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
    .setKey(APPWRITE_FUNCTION_API_KEY)

  try {
    const database = new sdk.Databases(client);
    // const users = new sdk.Users(client);
    const functions = new sdk.Functions(client);
    const event_data = JSON.parse(req.payload);
    const bid = event_data.bid;
    const bid_end_date = event_data.bid_end_date;
    const isRejected = event_data?.is_rejected ?? false;
    if(!isRejected){
    const updateData = {
      "current_price": bid.amount,
      "number_of_bids": bid.auction_art.number_of_bids + 1,
      "high_bid": [bid.$id],
    };
  
    if (bid_end_date) {
      updateData["auction_end_date"] = bid_end_date;
    }
    await database.updateDocument(bid.auction_art.$databaseId, bid.auction_art.$collectionId, bid.auction_art.$id, updateData);
    }
    else {
      const updateData= {
        "current_price": bid.amount,
        "number_of_bids": bid.auction_art.number_of_bids - 1,
        "high_bid": [bid.$id],
      }
      await database.updateDocument(bid.auction_art.$databaseId, bid.auction_art.$collectionId, bid.auction_art.$id, updateData);
    }
    res.json({
      "message":"it's all done"
    })
  } catch (error) {
    console.error("Error:", error);
    res.json({ "message": "Internal Server Error", "error": error.toString() }, 500);
  }
};