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
  // payload is like below : 
  /* {
    "$id": "5e5ea5c16897e",
    "$createdAt": "2020-10-15T06:38:00.000+00:00",
    "$updatedAt": "2020-10-15T06:38:00.000+00:00",
    "name": "John Doe",
    "password": "$argon2id$v=19$m=2048,t=4,p=3$aUZjLnliVWRINmFNTWMudg$5S+x+7uA31xFnrHFT47yFwcJeaP0w92L\/4LdgrVRXxE",
    "hash": "argon2",
    "hashOptions": {
        "type": "argon2",
        "memoryCost": 65536,
        "timeCost": 4,
        "threads": 3
    },
    "registration": "2020-10-15T06:38:00.000+00:00",
    "status": true,
    "passwordUpdate": "2020-10-15T06:38:00.000+00:00",
    "email": "+4930901820@appwrite.io",
    "phone": "+4930901820",
    "emailVerification": true,
    "phoneVerification": true,
    "prefs": {}
}
*/
  try {
    const payload = JSON.parse(req.variables['APPWRITE_FUNCTION_EVENT_DATA']);
    // get the user_id and create a user_profile document in the database with attributes first_name, last_name, email, phone, user_id
    const user_id = payload.$id;
    //parse phone out of email
    const phone = payload.email.split("@")[0];
    //create user_profile in the smart_auction database
    const user_profile = await database.createDocument(
      'smart_auction',
      'user_profile',
      sdk.ID.unique(),
      {
        phone_number: phone,
        user_id: user_id
      }
    );
    const user_update = await users.updatePrefs(user_id, {
      "profile_id": user_profile.$id
    }
    );
    const user_updated_phone = await users.updatePhone(user_id, phone);
    res.json({
      "message": "User profile created successfully",
      "user_profile": user_profile.$id
    });
  } catch (error) {
    res.json({
      "message": "Error creating user profile",
      "error": error
    });
  }
};
