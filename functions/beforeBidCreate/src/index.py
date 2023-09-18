from appwrite.client import Client
from appwrite.services.databases import Databases


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
    database = Databases(client)

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
    object_id = req.payload.get('$id', None)
    collection_id = req.payload.get('$collectionId', None)
    database_id = req.payload.get('$databaseId', None)
    # return the data gathered above
    return res.json(
        {
            "object_id": object_id,
            "collection_id": collection_id,
            "database_id": database_id
        }
    )
    if collection_id == 'bid':
        # get the actual object from database
        object = database.getDocument(database_id, collection_id, object_id)
    # get related auctionArt object from the same database
        auctionArt = database.getDocument(
            database_id, 'auction_art', object['auction_art'])
        # check if bid amount is higher than the current price of the auctionArt object
        if object['amount'] > auctionArt['current_price']:
            # update the current price of the auctionArt object
            auctionArt['current_price'] = object['amount']
            # update the auctionArt object in the database
            database.updateDocument(
                database_id, 'auction_art', auctionArt['$id'], auctionArt)
            # change bid status to accepted
            object['status'] = 'accepted'
            # update the bid object in the database
            database.updateDocument(
                database_id, collection_id, object_id, object)
            # return success response
            return res.json({
                "message": "Bid accepted successfully",
            })
        else:
            # change bid status to rejected
            object['status'] = 'rejected'
            # update the bid object in the database
            database.updateDocument(
                database_id, collection_id, object_id, object)
            # return error response
            return res.json({
                "message": "Bid amount is lower than the current price of the auctionArt object",
            })
    else:
        return res.json(
            {
                "message": "it's not a bid"
            }
        )
