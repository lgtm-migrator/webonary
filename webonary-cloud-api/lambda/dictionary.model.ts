/* eslint-disable max-classes-per-file */
export interface Language {
  lang: string;
  title: string;
  letters: string[];
  cssFiles: string[];
  entriesCount?: number;
}

export class LanguageItem implements Language {
  lang = '';

  title = '';

  letters: string[] = [];

  cssFiles: string[] = [];
}

export interface ListOption {
  lang: string;
  abbreviation: string;
  name: string;
  nameInsensitive?: string; // lowercase and normalized
  guid?: string;
}

export class ListOptionItem implements ListOption {
  lang = '';

  abbreviation = '';

  name = '';

  nameInsensitive? = '';

  guid? = '';
}

export interface Dictionary {
  _id: string;
  updatedAt: string;
  mainLanguage: Language;
  reversalLanguages: Language[];
  partsOfSpeech?: ListOption[];
  semanticDomains?: ListOption[];
}

export class DictionaryItem implements Dictionary {
  _id: string;

  updatedAt: string;

  mainLanguage: LanguageItem;

  reversalLanguages: LanguageItem[];

  partsOfSpeech?: ListOptionItem[];

  semanticDomains?: ListOptionItem[];

  constructor(dictionaryId: string, updatedAt?: string) {
    this._id = dictionaryId;
    this.updatedAt = updatedAt ?? new Date().toUTCString();

    // Set initial values so we can do Object.keys for dynamic case-insensitive copying
    this.mainLanguage = new LanguageItem();
    this.reversalLanguages = Array(new LanguageItem());
    this.partsOfSpeech = Array(new ListOptionItem());
    this.semanticDomains = Array(new ListOptionItem());
  }
}

export enum DbPaths {
  SEM_DOMS_LANG = 'semanticDomains.lang',
  SEM_DOMS_ABBREV = 'semanticDomains.abbrev',
  SEM_DOMS_VALUE = 'semanticDomains.value',
  SEM_DOMS_VALUE_INSENSITIVE = 'semanticDomains.valueInsensitive',
}
