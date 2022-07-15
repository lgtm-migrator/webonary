import { searchEntries, SearchEntriesArguments } from '../searchEntries';

import { upsertEntries } from '../postEntry';
import { createDictionary, setupMongo } from './databaseSetup';
import { Response } from '../response';

setupMongo();

const defaultArguments: SearchEntriesArguments = {
  $language: '',
  countTotalOnly: false,
  dictionaryId: 'test-dictionary-default',
  lang: undefined,
  mainLang: undefined,
  matchAccents: false,
  matchPartial: false,
  pageLimit: 10,
  pageNumber: 1,
  partOfSpeech: undefined,
  searchSemDoms: false,
  semDomAbbrev: undefined,
  text: 'test-text',
};

function parseGuids(response: Response): string[] {
  return (
    JSON.parse(response.body)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((entry: any) => entry.guid)
      .filter((guid: string) => guid)
      .sort()
  );
}

const testUsername = 'test-username';
describe('searchEntries', () => {
  test('empty dictionary returns 404', async () => {
    const dictionaryId = await createDictionary();

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
    });

    expect(response.statusCode).toBe(404);
  });

  test('matches text only in displayXhtml', async () => {
    const dictionaryId = await createDictionary();
    const searchText = 'test-mainHeadWord';
    const matchingGuid = 'test-matching-guid';
    await upsertEntries(
      [
        {
          guid: matchingGuid,
          displayXhtml: `<div>${searchText}</div>`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: searchText,
    });

    expect(response.statusCode).toBe(200);
    expect(parseGuids(response)).toEqual([matchingGuid]);
  });

  test('does not match tags in displayXhtml', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'test-guid',
          displayXhtml: `<div>some text</div>`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'div',
    });

    expect(response.statusCode).toBe(404);
  });

  test('does not match tag attributes in displayXhtml', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'test-guid',
          displayXhtml: `<a href="http://localhost">some text</a>`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'href',
    });

    expect(response.statusCode).toBe(404);
  });

  test('does not match tag attribute values in displayXhtml', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'test-guid',
          displayXhtml: `<a href="http://localhost">some text</a>`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'localhost',
    });

    expect(response.statusCode).toBe(404);
  });

  test('lang filters down to only entries with matching lang', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'guid-matching-1',
          displayXhtml: `text`,
          mainHeadWord: [
            {
              value: 'test-value',
              lang: 'matching-lang',
            },
          ],
        },
        {
          guid: 'guid-matching-2',
          displayXhtml: `text`,
          senses: [
            {
              definitionOrGloss: [
                {
                  lang: 'matching-lang',
                },
              ],
            },
          ],
        },
        {
          guid: 'guid-matching-3',
          displayXhtml: `text`,
          reversalLetterHeads: [
            {
              lang: 'matching-lang',
            },
          ],
        },
        {
          guid: 'guid-matching-4',
          displayXhtml: `text`,
          pronunciations: [
            {
              lang: 'matching-lang',
            },
          ],
        },
        {
          guid: 'guid-matching-5',
          displayXhtml: `text`,
          morphoSyntaxAnalysis: [
            {
              partOfSpeech: [
                {
                  lang: 'matching-lang',
                },
              ],
            },
          ],
        },
        {
          guid: 'guid-other',
          displayXhtml: `text`,
          mainHeadWord: [
            {
              lang: 'other-lang',
            },
          ],
        },
        {
          guid: 'guid-missing-lang',
          displayXhtml: `text`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'text',
      lang: 'matching-lang',
    });

    expect(parseGuids(response)).toEqual([
      'guid-matching-1',
      'guid-matching-2',
      'guid-matching-3',
      'guid-matching-4',
      'guid-matching-5',
    ]);
  });

  test('partOfSpeech filters out the irrelevant entries', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'guidA',
          displayXhtml: `text`,
          morphoSyntaxAnalysis: {
            partOfSpeech: [{ value: 'partA' }],
          },
        },
        {
          guid: 'guidAB',
          displayXhtml: `text`,
          morphoSyntaxAnalysis: {
            partOfSpeech: [{ value: 'partA' }, { value: 'partB' }],
          },
        },
        {
          guid: 'guidC',
          displayXhtml: `text`,
          morphoSyntaxAnalysis: {
            partOfSpeech: [{ value: 'partC' }],
          },
        },
        {
          guid: 'guidCD',
          displayXhtml: `text`,
          morphoSyntaxAnalysis: {
            partOfSpeech: [{ value: 'partC' }, { value: 'partD' }],
          },
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'text',
      partOfSpeech: 'partA',
    });

    expect(parseGuids(response)).toEqual(['guidA', 'guidAB']);
  });

  test('matchPartial match parts of words', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'word',
          displayXhtml: `word`,
        },
        {
          guid: 'or',
          displayXhtml: `or`,
        },
        {
          guid: 'other',
          displayXhtml: `other`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'or',
      matchPartial: true,
    });

    expect(parseGuids(response)).toEqual(['or', 'word']);
  });

  test('!matchAccents with clean search matches all accents and tones', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'accent',
          displayXhtml: `wórd`,
        },
        {
          guid: 'no-accent',
          displayXhtml: `word`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'word',
      matchAccents: false,
    });

    expect(parseGuids(response)).toEqual(['accent', 'no-accent']);
  });

  test('!matchAccents with accented search matches all accents and tones', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'accent',
          displayXhtml: `wórd`,
        },
        {
          guid: 'no-accent',
          displayXhtml: `word`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'wórd',
      matchAccents: false,
    });

    expect(parseGuids(response)).toEqual(['accent', 'no-accent']);
  });

  test('matchAccents filters out accents and tones', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'accent',
          displayXhtml: `wórd`,
        },
        {
          guid: 'no-accent',
          displayXhtml: `word`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'word',
      matchAccents: true,
    });

    expect(parseGuids(response)).toEqual(['no-accent']);
  });

  test('matchAccents matches only the searched accents and tones', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'accent-1',
          displayXhtml: `wórd`,
        },
        {
          guid: 'accent-2',
          displayXhtml: `wṓrd`,
        },
        {
          guid: 'no-accent',
          displayXhtml: `word`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'wṓrd',
      matchAccents: true,
    });

    expect(parseGuids(response)).toEqual(['accent-2']);
  });

  test('matchPartial and matchAccents matches only the searched accents and tones', async () => {
    const dictionaryId = await createDictionary();
    await upsertEntries(
      [
        {
          guid: 'accent-1',
          displayXhtml: `wórd`,
        },
        {
          guid: 'accent-2',
          displayXhtml: `wṓrd`,
        },
        {
          guid: 'no-accent',
          displayXhtml: `word`,
        },
      ],
      false,
      dictionaryId,
      testUsername,
    );

    const response = await searchEntries({
      ...defaultArguments,
      dictionaryId,
      text: 'wṓ',
      matchPartial: true,
      matchAccents: true,
    });

    expect(parseGuids(response)).toEqual(['accent-2']);
  });
});
