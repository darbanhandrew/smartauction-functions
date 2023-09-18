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
  /*  KAVENEGAR_URL=https://api.kavenegar.com/v1/
# KAVENEGAR_API_TOKEN=5635796B695150594374797671307476414458585369784D766B526F687$
# KAVENEGAR_SENDER_NUMBER=10000100007030
*/
  try {
    const KAVENEGAR_URL = req.variables['KAVENEGAR_URL'];
    const KAVENEGAR_API_TOKEN = req.variables['KAVENEGAR_API_TOKEN'];
    const KAVENEGAR_TEMPLATE = req.variables['KAVENEGAR_TEMPLATE'];

    //generate a 5 digit random number
    const secret = Math.floor(10000 + Math.random() * 90000);
    const user_id = req.payload ? JSON.parse(req.payload).user_id : JSON.parse(req.variables['APPWRITE_FUNCTION_EVENT_DATA']).$id;
    const user_prefs = await users.getPrefs(user_id);
    const update_user_prefs = await users.updatePrefs(user_id, {
      ...user_prefs,
      'verification_code': secret
    });
    const user = await users.get(user_id);
    //convert +98 to 0 and only get the number before @ sign
    const phone = user.email.replace('+98', '0').split('@')[0];
    //rewrite with https module
    https.get(`${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${phone}&token=${secret}&template=smartauctionverify`, (resp) => {
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
          "requestedURL": `${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${phone}&token=${secret}&template=smartauctionverify`,
          "message": "verification code sent successfully"
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
  } catch (error) {
    res.json({
      "status": "error on catch",
      "message": error
    });
  }
};
