import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { connectToDB, success, notFound, DB_NAME, COLLECTION_ENTRIES } from './mongo';

let dbClient: MongoClient;

export async function handler(
  event: APIGatewayEvent,
  context: Context,
  callback: Callback,
): Promise<void> {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    dbClient = await connectToDB();
    const db = dbClient.db(DB_NAME);
    // / const dictionary = event.pathParameters?.dictionary;
    const _id = event.queryStringParameters?.guid;
    const dbItem = await db.collection(COLLECTION_ENTRIES).findOne({ _id });
    if (!dbItem) {
      return callback(null, notFound({}));
    }
    return callback(null, success(dbItem));
  } catch (err) {
    return callback(`Error occurred while getEntry: ${JSON.stringify(err)}`);
  } finally {
    await dbClient.close();
  }
}

export default handler;
