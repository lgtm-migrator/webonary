import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { connectToDB } from './mongo';
import { DB_NAME, COLLECTION_DICTIONARIES } from './db';
import * as Response from './response';

let dbClient: MongoClient;

export async function handler(
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
): Promise<void> {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  const _id = event.pathParameters?.dictionaryId;
  try {
    dbClient = await connectToDB();
    const db = dbClient.db(DB_NAME);
    const dbItem = await db.collection(COLLECTION_DICTIONARIES).findOne({ _id });
    if (!dbItem) {
      return callback(null, Response.notFound({}));
    }
    return callback(null, Response.success(dbItem));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return callback(null, Response.failure({ errorType: error.name, errorMessage: error.message }));
  }
}

export default handler;
