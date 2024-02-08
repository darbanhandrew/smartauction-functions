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
  //send najva notification to specific user using user id . 
  // the token is stored in the user prefs najva_token_id and user_profile collection with the same user_id in attribute of najva_token_id
  // const payload = JSON.parse(req.payload);
  // const userId = payload.userId;
  // const title = payload.title;
  // const body = payload.body;
  // const icon = payload.icon;
  // const image = payload.image;
  // const url = payload.url;
  // const data = payload.data;

  // const user = await users.getPrefs(userId);
  const token = "0e8f4e43-f69a-4b40-8f93-632a47394974";

  const najva_api_token = req.variables['NAJVA_API_TOKEN'];
  const najva_api_url = req.variables['NAJVA_API_URL'];
  const najva_api_version = req.variables['NAJVA_API_VERSION'];
  /*
  Body
{
"api_key": "<YOUR_API_KEY>",
"subscriber_tokens": [TOKEN1, TOKEN2, ...],
"title": "title",
"body": "body",
"onclick_action": "<YOUR_ACTION>",
"url": "http://example.com",
"content": "some content",
"json":"{\"key\":\"value\"}",
"icon": "https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg",
"image": "https://images.pexels.com/photos/236047/pexels-photo-236047.jpeg?cs=srgb&dl=clouds-cloudy-countryside-236047.jpg&fm=jpg",
"sent_time": "2019-01-07T12:00:00"
}
*/
  /*
  Request
  URL: https://app.najva.com/notification/api/v1/notifications/
  HTTP-Method: POST
  HTTP-Headers:
  Content-Type: application/json
  Authorization: Token "<YOUR_TOKEN>"
  
  */

  const response = await fetch(najva_api_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + "524e1ba28edee1a119fea85314d2f05669ea6a76",
      'X-api-key': najva_api_token
    },
    /*
    {
  "x-api-key": "your_api_key_here",
  "title": "Your Notification Title",
  "body": "Your Notification Body",
  "onclick_action": 0,
  "url": "https://your-notification-url.com"
}
`  */
    body: JSON.stringify({
  "x-api-key": najva_api_token,
  "title": "Your Notification Title",
  "body": "Your Notification Body",
  "onclick_action": 0,
  "url": "https://your-notification-url.com",
  "utm":{},
  "light_up_screen":true,
  "buttons":[],
  "subscribers":["651e1da9-2bd2-4ff6-b4e7-339f388b8672"]
}
),
  });
  const json = await response.json();
  console.log(json);
  /* check based on response code */
  /* samples are: 
  201
  {
  “result”: “Notification is created successfully.”,
  “count”: 2,
  “details”: {
    “title”: “title”,
    “body”: “body”,
    “url”: “http://example.com”,
    “icon”: “/static/media/upload/icon_uploads/13946ba7-0c0a-47ae-8fc1-012e5c83e637.jpeg”,
    “image”: “/static/media/upload/icon_uploads/416380cb-e530-48a7-8184-29f77890855e.jpeg”,
    “sent_time”: “2019-01-07T12:00:00”
  }
}
401 
{
  “result”: “Passed data is invalid.”,
  “details”: {
    “api_key”: [
      “این فیلد لازم است.”
    ],
    “subscriber_tokens”: [
      “این فیلد لازم است.”
    ],
    “title”: [
      “این فیلد لازم است.”
    ],
    “body”: [
      “این فیلد لازم است.”
    ],“url”: [
      “این فیلد لازم است.”
    ]
  }
}
403 
{
  “detail”: “Authentication credentials were not provided.”
}
*/

  if (response.status == 201) {
    res.json({
      //send body and a message 
      body: req.payload,
      message: 'Notification sent successfully',
    });
  } else if (response.status == 401) {
    res.json({
      //send body and a message
      body: req.payload,
      message: 'Passed data is invalid',
    });
  } else if (response.status == 403) {
    res.json({
      //send body and a message
      body: req.payload,
      message: 'Authentication credentials were not provided',
    });
  } else {
    res.json({
      //send body and a message
      body: req.payload,
      message: 'Something went wrong',
    });
  }

};
