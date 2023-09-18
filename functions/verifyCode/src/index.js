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
    const user_id = payload.user_id;
    const user_prefs = await users.getPrefs(user_id);
    const code = payload.code;
    if (user_prefs.verification_code == code) {
      const update_verification = await users.updatePhoneVerification(user_id, true);
      res.json({
        "verification": "success"
      });
    }
    else {
      res.json({
        "verification": "failed"
      });
    }
  } catch (error) {
    console.error(error);
    res.json({
      "verification": "failed",
      "error": "catch error"
    });
  }



};
