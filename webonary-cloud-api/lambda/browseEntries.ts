import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { MongoClient } from 'mongodb';
import { connectToDB, DB_NAME, COLLECTION_ENTRIES, DbFindParameters } from './mongo';
import * as response from './response';
import { Entry } from '../tools/flexXhtmlParser';

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

    const dictionary = event.pathParameters?.dictionary ?? '';
    const letterHead = event.queryStringParameters?.letterHead;
    const lang = event.queryStringParameters?.lang;

    const dbFind: DbFindParameters = {};
    dbFind.dictionary = dictionary;

    if (letterHead) {
      if (lang) {
        dbFind.reverseLetterHeads = { lang, value: letterHead };
      } else {
        dbFind.letterHead = letterHead;
      }
    }

    const entries = await db
      .collection(COLLECTION_ENTRIES)
      .find(dbFind)
      .toArray();

    if (!entries.length) {
      return callback(null, response.notFound([{}]));
    }

    let entriesSorted: Entry[] = [];
    if (lang) {
      entriesSorted = entries.sort((a: Entry, b: Entry): number => {
        const aWord = a.senses.definitionOrGloss.find(letter => letter.lang === lang);
        const bWord = b.senses.definitionOrGloss.find(letter => letter.lang === lang);
        if (aWord && bWord) {
          return aWord.value.localeCompare(bWord.value);
        }
        return 0;
      });
    } else {
      entriesSorted = entries.sort((a: Entry, b: Entry): number => {
        return a.mainHeadWord[0].value.localeCompare(b.mainHeadWord[0].value);
      });
    }
    return callback(null, response.success(entriesSorted));
  } catch (err) {
    return callback(`Error occurred in browseEntries: ${JSON.stringify(err)}`);
  } finally {
    await dbClient.close();
  }
}

export default handler;
