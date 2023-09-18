const sdk = require("node-appwrite");
const https = require('https');
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
  const KAVENEGAR_URL = req.variables['KAVENEGAR_URL'];
  const KAVENEGAR_API_TOKEN = req.variables['KAVENEGAR_API_TOKEN'];
  const auction_request_id = req.payload ? JSON.parse(req.payload).$id : JSON.parse(req.variables['APPWRITE_FUNCTION_EVENT_DATA']).$id;
  console.stdlog("auction_request_id: " + auction_request_id);
  const user_auction_request = await database.getDocument('smart_auction', 'user_auction_request', auction_request_id);
  console.stdlog("user_auction_request: " + user_auction_request);
  const user = await users.get(user_auction_request.user_id);
  console.stdlog("user: " + user);
  const user_profile = await database.getDocument('smart_auction', 'user_profile', user.prefs.profile_id);
  console.stdlog("user_profile: " + user_profile);
  let full_name = user_profile.first_name + '_' + user_profile.last_name;
  console.stdlog("full_name: " + full_name);
  let auction_request_status = user_auction_request.status;
  console.stdlog("auction_request_status: " + auction_request_status);
  let auction_name = user_auction_request.auction.name;
  //trim spaces of auction name and replace spaces with underscore
  auction_name = auction_name.trim().replace(/\s/g, '_');
  full_name = full_name.trim().replace(/\s/g, '_');
  if (auction_request_status == 'rejected') {
    auction_request_status = 'رد_شد';
  }
  else if (auction_request_status == 'accepted') {
    auction_request_status = 'تایید_شد';
  }
  https.get(`${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${user_profile.phone_number}&token=${full_name}&token2=${auction_name}&token3=${auction_request_status}&template=smartauctionauctionreq`, (resp) => {
    let data = '';
    // A chunk of data has been received.
    resp.on('data', (chunk) => {
      data += chunk;
    });
    // The whole response has been received. Print out the result.
    resp.on('end', () => {
      res.json({
        "status": "success",
        "data": JSON.parse(data),
        "requestedURL": `${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${user_profile.phone}&token=${full_name}&token2=${auction_name}&token3=${auction_request_status}&template=smartauctionauctionreq`,
        "message": "sms sent successfully"
      });
    });
  }
  ).on("error", (err) => {
    res.json({
      "status": "error",
      "message": err
    });
  }
  );


};
