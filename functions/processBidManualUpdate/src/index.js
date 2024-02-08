const sdk = require("node-appwrite");

module.exports = async function (req, res) {
  const client = new sdk.Client();

  // Reuse the client instance
  if (req.variables['APPWRITE_FUNCTION_ENDPOINT'] && req.variables['APPWRITE_FUNCTION_API_KEY']) {
    client
      .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
      .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
      .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
      .setSelfSigned(true);
  } else {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
    res.json({ "message": "Environment variables not set." });
    return;
  }

  const database = new sdk.Databases(client);

  try {
    const event_data = JSON.parse(req.variables["APPWRITE_FUNCTION_EVENT_DATA"]);

    // Fetch the bid and auction details in parallel
    const [bid, auction_art] = await Promise.all([
      database.getDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id),
      database.getDocument(event_data.auction_art.$databaseId, event_data.auction_art.$collectionId, event_data.auction_art.$id)
    ]);

    if (bid.manual_update && bid.status === "rejected") {
      if (auction_art.high_bid[0].$id === bid.$id) {
        const next_highest_bid_list = await database.listDocuments(bid.$databaseId, bid.$collectionId, [
          sdk.Query.equal("auction_art", [bid.auction_art.$id]),
          sdk.Query.limit(1),
          sdk.Query.offset(1),
          sdk.Query.orderDesc("amount"),
        ]);

        if (next_highest_bid_list.total < 1) {
          res.json({ "message": "There is no other winner" });
        } else {
          const next_highest_bid = next_highest_bid_list.listDocuments[0];
          // Batch update
          const updateAuctionArtPromise = functions.createExecution("updateAuctionArt",JSON.stringify({"bid":next_highest_bid,"bid_end_date":null,"is_rejected":true}),true)
          Promise.all(
          [updateAuctionArtPromise]
          );
        }
        res.json({ "message": "It's completely done" });
      }
    } else if (bid.manual_update && bid.status === "accepted") {
      if (auction_art.high_bid[0].$id !== bid.$id && auction_art.current_price < bid.amount) {
        // Batch update
        const updateAuctionArtPromise = functions.createExecution("updateAuctionArt",JSON.stringify({"bid":bid,"bid_end_date":null,"is_rejected":false}),true)
        Promise.all(
        [updateAuctionArtPromise]
        );
      }
      res.json({ "message": "Successfully updated" });
    } else {
      res.json({ "message": "Nothing to be done" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.json({ "message": "Internal Server Error" }, 500);
  }
};
