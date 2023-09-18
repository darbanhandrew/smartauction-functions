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
    const payload = JSON.parse(req.variables['APPWRITE_FUNCTION_EVENT_DATA']);
    const user_profile = await database.getDocument(payload.$databaseId, payload.$collectionId, payload.$id);
    if (user_profile?.first_name && user_profile?.last_name && user_profile?.user_id && user_profile?.phone_number && user_profile?.email && user_profile?.national_id_image && (user_profile?.status == 'not_filled' || user_profile?.status == 'rejected')) {
      const update_status = await database.updateDocument(payload.$databaseId, payload.$collectionId, payload.$id, {
        status: 'pending'
      });
    }
    if (user_profile?.first_name && user_profile?.last_name && user_profile?.user_id) {
      const full_name = user_profile.first_name + " " + user_profile.last_name;
      const result = await users.updateName(user_profile.user_id, full_name);
      res.json(result);
    }
  } catch (error) {
    console.error(error);
    res.json({
      error: error,
    });
  }
}
