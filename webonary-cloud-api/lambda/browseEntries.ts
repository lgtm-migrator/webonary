import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { connectToDB } from './mongo';
import { DB_NAME, DB_COLLECTION_ENTRIES, DbFindParameters, EntryData } from './db';
import * as Response from './response';

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

    const dictionaryId = event.pathParameters?.dictionaryId;
    const text = event.queryStringParameters?.text;
    const lang = event.queryStringParameters?.lang;

    let errorMessage = '';
    if (!text) {
      errorMessage = 'Browse letter head must be specified.';
    }

    if (errorMessage) {
      return callback(null, Response.badRequest(errorMessage));
    }

    const dbFind: DbFindParameters = {};
    dbFind.dictionaryId = dictionaryId;

    if (text) {
      if (lang) {
        dbFind.reversalLetterHeads = { lang, value: text };
      } else {
        dbFind.letterHead = text;
      }
    }

    const entries: EntryData[] = await db
      .collection(DB_COLLECTION_ENTRIES)
      .find(dbFind)
      .toArray();

    if (!entries.length) {
      return callback(null, Response.notFound([{}]));
    }

    let entriesSorted: EntryData[] = [];
    if (lang) {
      entriesSorted = entries.sort((a, b) => {
        const aWord = a.senses.definitionOrGloss.find(letter => letter.lang === lang);
        const bWord = b.senses.definitionOrGloss.find(letter => letter.lang === lang);
        if (aWord && bWord) {
          return aWord.value.localeCompare(bWord.value);
        }
        return 0;
      });
    } else {
      entriesSorted = entries.sort((a, b) => {
        return a.mainHeadWord[0].value.localeCompare(b.mainHeadWord[0].value);
      });
    }
    return callback(null, Response.success(entriesSorted));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return callback(null, Response.failure({ errorType: error.name, errorMessage: error.message }));
  }
}

export default handler;
