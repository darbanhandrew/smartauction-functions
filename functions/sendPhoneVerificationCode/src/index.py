from appwrite.client import Client
import requests
# You can remove imports of services you don't use
from appwrite.services.users import Users

"""
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with code 500 will be returned.
"""

def main(req, res):
  client = Client()

  # You can remove services you don't use
  users = Users(client)

  if not req.variables.get('APPWRITE_FUNCTION_ENDPOINT') or not req.variables.get('APPWRITE_FUNCTION_API_KEY'):
    print('Environment variables are not set. Function cannot use Appwrite SDK.')
  else:
    (
    client
      .set_endpoint(req.variables.get('APPWRITE_FUNCTION_ENDPOINT', None))
      .set_project(req.variables.get('APPWRITE_FUNCTION_PROJECT_ID', None))
      .set_key(req.variables.get('APPWRITE_FUNCTION_API_KEY', None))
      .set_self_signed(True)
    )
  secret = req.payload.get('secret', None)
  user_id = req.payload.get('userId', None)
  #get user phone number from user_id using appwrite sdk and send secret to kavenegar
  phone_number = users.get(user_id).get('phone', None)
  # get these variables from req.variables.get : 
#   KAVENEGAR_URL=https://api.kavenegar.com/v1/
# KAVENEGAR_API_TOKEN=5635796B695150594374797671307476414458585369784D766B526F687$
# KAVENEGAR_SENDER_NUMBER=10000100007030
# KAVENEGAR_URL=https://api.kavenegar.com/v1/

  URL = req.variables.get('KAVENEGAR_URL', None)
  API_TOKEN = req.variables.get('KAVENEGAR_API_TOKEN', None)
  TEMPLATE = req.variables.get('KAVENEGAR_TEMPLATE', None)
  if secret is not None and user_id is not None:
      url = f"{URL}/{API_TOKEN}/verify/lookup.json?receptor={phone_number}&template={TEMPLATE}&token={secret}"

      try:
          response = requests.get(url)
          if response.ok:
              return res.json({
    "areDevelopersAwesome": True,
  })
      except Exception as e:
          res.json({
    "areDevelopersAwesome": False,
  })