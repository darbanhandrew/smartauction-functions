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
  // make it a list 
  const artists = [

    "مصطفی سرابی",
    "منوچهر صفرزاده",
    "منوچهر نیازی",
    "مهدی حسینی",
    "مهدی طالع نیا",
    "مهدی منتصری",
    "مهدی نبوی",
    "مهرداد علایی نجات",
    "مهرداد محبعلی",
    "مژگان مدنی",
    "مکرمه قنبری",
    "میشا شهبازیان",
    "ناشناس",
    "ناصر اویسی",
    "ناصر بخشی",
    "ناصر عصار",
    "ناصر محمدی",
    "نجلا مهدوی اشرف",
    "نصرالله افجه ای",
    "نصرالله معین",
    "نصرالله کسرائیان",
    "نصرت الله مسلمیان",
    "نقاشی پشت شیشه",
    "نهاپت نهاپتیان",
    "نیکزاد نجومی",
    "هادی روشن ضمیر",
    "هادی فدوی",
    "هانیبال الخاص",
    "همایون سلیمی",
    "هوشنگ سیحون",
    "واحد خاکدان",
    "پارسا مستقیم",
    "پروانه اعتمادی",
    "پرویز تناولی",
    "پوریا درویش",
    "ژازه تباتبایی",
    "کارگاه  بهزاد",
    "کاظم ایزی",
    "کامبیز درمبخش",
    "کتایون تهرانی",
    "کیخسرو خروش",
    "کیومرث کیاست",
    "گارنیک در هاکوپیان",
    "یرواند نهاپتیان",
    "یعقوب مشفقی فر"
  ];


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
  artists.forEach(async (artist) => {
    const response = await database.createDocument('smart_auction', 'artist', sdk.ID.unique(), {
      name: artist,
    });
    console.log(response);
    // res.json(response);
  });
};
