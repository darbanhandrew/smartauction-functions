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
  const auction_arts_with_on_going_status = await database.listDocuments(
    'smart_auction',
    'auction_art',
    [
      sdk.Query.equal('status', 'on_going'),
    ]
  );
  /* check if the attribute 'auction_start_date' and 'auction_end_date' is set  and update the status of the auction art  if the auction end date is passed or the auction start date is not passed */
  auction_arts_with_on_going_status.documents.forEach(async (auction_art) => {
    if (auction_art.auction_start_date && auction_art.auction_end_date) {
      const auction_start_date = new Date(auction_art.auction_start_date);
      const auction_end_date = new Date(auction_art.auction_end_date);
      const current_date = new Date();
      if (current_date > auction_end_date) {
        const result = await database.updateDocument(
          'smart_auction',
          'auction_art',
          auction_art.$id,
          {
            status: 'closed',
          }
        );
      }
      if (current_date < auction_start_date) {
        const result = await database.updateDocument(
          'smart_auction',
          'auction_art',
          auction_art.$id,
          {
            status: 'not_started',
          }
        );
      }
    }
  });

  const auction_arts_with_not_started_status = await database.listDocuments(
    'smart_auction',
    'auction_art',
    [
      sdk.Query.equal('status', 'not_started'),
    ]
  );
  /* check if the attribute 'auction_start_date' and 'auction_end_date' is set  and update the status of the auction art  if the auction start date is passed */
  auction_arts_with_not_started_status.documents.forEach(async (auction_art) => {
    if (auction_art.auction_start_date && auction_art.auction_end_date) {
      const auction_start_date = new Date(auction_art.auction_start_date);
      const auction_end_date = new Date(auction_art.auction_end_date);
      const current_date = new Date();
      if (current_date > auction_start_date && current_date < auction_end_date) {
        const result = await database.updateDocument(
          'smart_auction',
          'auction_art',
          auction_art.$id,
          {
            status: 'on_going',
          }
        );
      }
    }
  });

  res.json({
    areDevelopersAwesome: true,
  });
};
