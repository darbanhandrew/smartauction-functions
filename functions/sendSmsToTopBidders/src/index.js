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
    .setSelfSigned(true);

  try {
    const database = new sdk.Databases(client);
    const users = new sdk.Users(client);
    const event_data = JSON.parse(req.payload);
    const bid = await database.getDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id);

    const bids = await database.listDocuments('smart_auction', 'bid', [
      sdk.Query.equal('auction_art', bid.auction_art.$id),
      sdk.Query.equal('status', 'accepted'),
      sdk.Query.orderDesc('amount'),
      sdk.Query.notEqual("user_id", bid.user_id),
      sdk.Query.limit(3)
    ]);

    if (bids.total < 1) {
      // No bids to send messages, so respond accordingly
      res.json({
        "bid": event_data,
        "status": "accepted",
        "sent_ids": [] // or any other appropriate response
      });
      return;
    }

    const sent_user_ids = [];

    await Promise.all(bids.documents.map(async (bidDocument) => {
      try {
        const user = await users.get(bidDocument.user_id);
        if (!sent_user_ids.includes(user.$id)) {
          const user_profile = await database.getDocument('smart_auction', 'user_profile', user.prefs.profile_id);
          let full_name = user_profile.first_name + ' ' + user_profile.last_name;
          let auction_art_name = bid.auction_art.auction.name + '-' + bid.auction_art.lot;
          let new_amount = bidDocument.amount;
          await sendSms(KAVENEGAR_URL, KAVENEGAR_API_TOKEN, user_profile.phone_number, full_name, auction_art_name, new_amount);
          sent_user_ids.push(user.$id);
        }
      } catch (error) {
        console.error(error);
        throw error; // Propagate the error to reject the bid
      }
    }));

    res.json({
      "bid": event_data,
      "status": "accepted",
      "sent_ids": sent_user_ids
    });

  } catch (error) {
    console.error("Error:", error);
    res.json({ "message": "Internal Server Error", "error": error.toString() }, 500);
  }
};

async function sendSms(KAVENEGAR_URL, KAVENEGAR_API_TOKEN, phoneNumber, fullName, auctionArtName, newAmount) {
  return new Promise((resolve, reject) => {
    https.get(`${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${phoneNumber}&token10=${fullName}&token20=${auctionArtName}&token=${newAmount}&template=higherbid`, (response) => {
      resolve();
    }).on('error', (error) => {
      reject(error);
    });
  });
}
