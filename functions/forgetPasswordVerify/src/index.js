const sdk = require("node-appwrite");
const jwt = require('jsonwebtoken');
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
  const KAVENEGAR_URL = req.variables['KAVENEGAR_URL'];
  const KAVENEGAR_API_TOKEN = req.variables['KAVENEGAR_API_TOKEN'];
  const secret = "Mohammad";
  const payload = JSON.parse(req.payload);
  if (payload.method == "getCode") {
    const email = payload.email;
    const usersList = await users.list([
      sdk.Query.equal('email', email)
    ]);
    if (usersList.total > 0) {
      const user = usersList.users[0];
      const phone = user.phone;
      const secret_code = Math.floor(10000 + Math.random() * 90000);
      const user_prefs = await users.getPrefs(user.$id);
      const update_user_prefs = await users.updatePrefs(user.$id, {
        ...user_prefs,
        secret_code: secret_code
      });
      https.get(`${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${phone}&token=${secret_code}&template=smartauctionresetpassword`, (resp) => {
        let data = '';
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
          data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          res.json({
            status: "success",
            data: JSON.parse(data),
            requestedURL: `${KAVENEGAR_URL}${KAVENEGAR_API_TOKEN}/verify/lookup.json?receptor=${phone}&token=${secret_code}&template=smartauctionresetpassword`,
            message: "Token sent to your phone number"
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
    } else {
      res.json({
        message: "User not found",
        status: "error"
      });
    }
  }
  else if (payload.method == "verifyCode") {
    const email = payload.email;
    const code = payload.code;
    const usersList = await users.list([
      sdk.Query.equal('email', email)
    ]);
    if (usersList.total > 0) {
      const user = usersList.users[0];
      if (code == user.prefs.secret_code) {
        const token = jwt.sign({ id: user.$id, secret_code: code }, secret, { expiresIn: '300sec' });
        res.json({
          message: "User verified",
          status: "success",
          token: token
        });
      }
      else {
        res.json({
          message: "User not verified",
          status: "error"
        });
      }
    }
  }
  else if (payload.method == "verifyToken") {
    const token = payload.token;
    const decoded = jwt.verify(token, secret);
    const update_user_password = await users.updatePassword(decoded.id, payload.password);
    if (update_user_password.$id == decoded.id) {
      res.json({
        message: "User password updated",
        status: "success"
      });
    }
  } else {
    res.json({
      message: "User password not updated",
      status: "error"
    });
  }
};
