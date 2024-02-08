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
    const event_data = JSON.parse(req.variables["APPWRITE_FUNCTION_EVENT_DATA"]);
    const bid = await database.getDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id);

    if (isValidBid(bid)) {
      const bid_end_date = updateBidEndDate(bid);
      const updateBidStatusPromise = updateBidStatus(database, event_data, "accepted");

      const functionExecutionPromise = functions.createExecution("sendSmsToTopBidders", JSON.stringify(bid), true);
      const updateAuctionArtPromise = functions.createExecution("updateAuctionArt",JSON.stringify({"bid":bid,"bid_end_date":bid_end_date,"is_rejected":false}),true)
      await Promise.all([
        updateBidStatusPromise,
        functionExecutionPromise,
        updateAuctionArtPromise
      ]);

      // If bid_end_date is not null, execute these additional functions
      if (bid_end_date) {
        await updateAuctionEndDate(database, bid, bid_end_date);
      }

      // const sent_user_ids = await getSentUserIds(database, bid, users);

      res.json({
        "bid": event_data,
        "status": "accepted",
        // "sent_ids": sent_user_ids
      });
    } else {
      await updateBidStatus(database, event_data, "rejected");
      res.json({
        "bid": event_data,
        "status": "rejected"
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.json({ "message": "Internal Server Error", "error": error.toString() }, 500);
  }
};

function isValidBid(bid) {
  const bid_created_date = new Date(bid.$createdAt);
  return bid.amount > bid.auction_art.current_price &&
    bid_created_date >= new Date(bid.auction_art.auction_start_date) &&
    bid_created_date <= new Date(bid.auction_art.auction_end_date);
}

function updateBidEndDate(bid) {
  const bid_end_date = new Date(bid.auction_art.auction_end_date);
  const bid_created_date = new Date(bid.$createdAt);
  const diff = (bid_end_date - bid_created_date) / 60000;

  if (diff < 30) {
    bid_end_date.setMinutes(bid_end_date.getMinutes() + 30);
    if (bid_end_date > new Date(bid.auction_art.auction.end_date)) {
      return bid_end_date;
    }
  }

  return null;
}

async function updateBidStatus(database, event_data, status) {
  await database.updateDocument(event_data.$databaseId, event_data.$collectionId, event_data.$id, {
    "status": status
  });
}



// async function updateAuctionEndDate(database, bid, bid_end_date) {
//   if (bid_end_date) {
//     await database.updateDocument(bid.auction_art.auction.$databaseId, bid.auction_art.auction.$collectionId, bid.auction_art.auction.$id, {
//       "end_date": bid_end_date
//     });
//   }
// }

// async function sendSmsToTopBidders(database, bid, users, KAVENEGAR_URL, KAVENEGAR_API_TOKEN) {
//   try {
//     const bids = await database.listDocuments('smart_auction', 'bid', [
//       sdk.Query.equal('auction_art', bid.auction_art.$id),
//       sdk.Query.equal('status', 'accepted'),
//       sdk.Query.orderDesc('amount'),
//       sdk.Query.notEqual("user_id", bid.user_id),
//       sdk.Query.limit(3)
//     ]);

//     const sent_user_ids = [];

//     await Promise.all(bids.documents.map(async (bidDocument) => {
//       try {
//         const user = await users.get(bidDocument.user_id);
//         if (!sent_user_ids.includes(user.$id)) {
//           const user_profile = await database.getDocument('smart_auction', 'user_profile', user.prefs.profile_id);
//           let full_name = user_profile.first_name + ' ' + user_profile.last_name;
//           let auction_art_name = bid.auction_art.auction.name + '-' + bid.auction_art.lot;
//           let new_amount = bidDocument.amount;
//           await sendSms(KAVENEGAR_URL, KAVENEGAR_API_TOKEN, user_profile.phone_number, full_name, auction_art_name, new_amount);
//           sent_user_ids.push(user.$id);
//         }
//       } catch (error) {
//         console.error(error);
//         throw error; // Propagate the error to reject the bid
//       }
//     }));

//     return sent_user_ids;
//   } catch (error) {
//     console.error(error);
//     throw error; // Propagate the error to reject the bid
//   }
// }

// async function getSentUserIds(database, bid, users) {
//   const bids = await database.listDocuments('smart_auction', 'bid', [
//     sdk.Query.equal('auction_art', bid.auction_art.$id),
//     sdk.Query.equal('status', 'accepted'),
//     sdk.Query.orderDesc('amount'),
//     sdk.Query.notEqual("user_id", bid.user_id),
//     sdk.Query.limit(3)
//   ]);

//   const sent_user_ids = [];
//   for (let i = 0; i < bids.documents.length; i++) {
//     try {
//       const user = await users.get(bids.documents[i].user_id);
//       if (!sent_user_ids.includes(user.$id)) {
//         sent_user_ids.push(user.$id);
//       }
//     } catch (error) {
//       console.error(error);
//       throw error; // Propagate the error to reject the bid
//     }
//   }
//   return sent_user_ids;
// }

// async function sendSms(KAVENEGAR_URL, KAVENEGAR_API_TOKEN, phoneNumber, fullName, auctionArtName, newAmount) {
//   return new Promise((resolve, reject) => {
//     https.get(`${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${phoneNumber}&token10=${fullName}&token20=${auctionArtName}&token=${newAmount}&template=higherbid`, (response) => {
//       resolve();
//     }).on('error', (error) => {
//       reject(error);
//     });
//   });
// }
