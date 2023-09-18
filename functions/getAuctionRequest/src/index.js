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
    const user_id = JSON.parse(req.payload).user_id;
    const auction_id = JSON.parse(req.payload).auction_id;
    const isSet = JSON.parse(req.payload).isSet;
    const referee_name = JSON.parse(req.payload).referee_name;
    const referee_phone = JSON.parse(req.payload).referee_phone;
    if (isSet) {
      const auction_request = await database.createDocument('smart_auction', 'user_auction_request', sdk.ID.unique(), {
        user_id: user_id,
        auction: auction_id,
        referee_name: referee_name,
        referee_phone: referee_phone,
      });
      res.json(auction_request);
    }
    else {
      const user_auction_requests = await database.listDocuments('smart_auction', 'user_auction_request', [
        sdk.Query.equal('user_id', user_id),
        sdk.Query.equal('auction', auction_id),
        sdk.Query.orderDesc('$createdAt')
      ]);
      //if user has no auction request , create one, else return the last one 
      if (user_auction_requests.documents.length == 0) {
        res.json({
          "error": "no auction request"
        });
      }
      else {
        res.json(user_auction_requests.documents[0]);
      }
    }
    //get user auction requests

  }
  //get user_id from payload
  catch (error) {
    console.error(error);
    res.json({
      "error": "catch error"
    });
  }
};
