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
  const avatars = new sdk.Avatars(client);
  const database = new sdk.Databases(client);
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
  //get a string and a body from JSON.parse(req.payload) 
  //and using the Users class, run the string as method of users with body as parameter
  //and return the result as JSON


  const payload = JSON.parse(req.payload);
  //put if on type of payload.body so it can be used for a variety of functions
  let result;
  if (payload.type == "create") {
    const email = payload.body.email;
    const phone = payload.body.phone;
    const password = payload.body.password;
    const name = payload.body.name;
    result = await users[payload.type](sdk.ID.unique(), email, password, name, phone);
  }
  else if (payload.type == "listMemberships") {
    const user_id = payload.body.user_id;
    result = await users[payload.type](user_id);
  }
  else if (payload.type == "convertToUserDevice")
  {
    const userDocuments = await users.list([
      sdk.Query.limit(1000)
    ]);
    await Promise.all(userDocuments.users.map(async (user) => {
      const userToken = user.prefs?.najva_api_token
      if(userToken)
      {
        await database.createDocument("smart_auction","user_device",sdk.ID.unique(),{user_id:user.$id,token:userToken});
      }
    }));
  }
  else {
    result = await users[payload.type]();
  }
  res.json(result);

  res.json({
    areDevelopersAwesome: true,
  });
};
