import { newAccountSlugSchema } from '@bidplace/contracts';
import {
  animals,
  colors,
  NumberDictionary,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import type {
  NicknameSuggestionGenerator,
  NicknameSuggestions,
} from './nickname-suggestion-generator';

const allowedColors = new Set([
  'amber',
  'aqua',
  'azure',
  'blue',
  'coral',
  'cyan',
  'gold',
  'green',
  'indigo',
  'jade',
  'lime',
  'olive',
  'orange',
  'peach',
  'pink',
  'plum',
  'rose',
  'silver',
  'teal',
  'violet',
]);

const allowedAnimals = new Set([
  'alpaca',
  'badger',
  'bear',
  'bison',
  'cat',
  'crane',
  'deer',
  'dolphin',
  'dove',
  'eagle',
  'falcon',
  'finch',
  'fox',
  'gecko',
  'heron',
  'koala',
  'lark',
  'lemur',
  'lion',
  'lynx',
  'otter',
  'owl',
  'panda',
  'puffin',
  'quokka',
  'raven',
  'sparrow',
  'swan',
  'tiger',
  'turtle',
  'whale',
  'wolf',
  'wombat',
  'wren',
  'zebra',
]);

const neutralColors = colors.filter((color) => allowedColors.has(color));
const neutralAnimals = animals.filter((animal) => allowedAnimals.has(animal));
const neutralStems = [...neutralColors, ...neutralAnimals];
const neutralSuffixCount = 900;
const randomAttemptLimit = 12;
const fallbackAttemptLimit = 128;

export const nicknameSuggestionSpaceSize =
  neutralStems.length * neutralSuffixCount;

class UniqueNamesNicknameSuggestionGenerator implements NicknameSuggestionGenerator {
  generate(excluded: readonly string[] = []): NicknameSuggestions {
    const suggestions = new Set<string>();
    const blocked = new Set(excluded);

    for (
      let attempt = 0;
      attempt < randomAttemptLimit && suggestions.size < 3;
      attempt += 1
    ) {
      this.addIfValid(
        suggestions,
        blocked,
        uniqueNamesGenerator({
          dictionaries: [
            neutralStems,
            NumberDictionary.generate({ min: 100, max: 1000 }),
          ],
          length: 2,
          separator: '',
          style: 'lowerCase',
        }),
      );
    }

    for (
      let attempt = 0;
      attempt < fallbackAttemptLimit && suggestions.size < 3;
      attempt += 1
    ) {
      const stem = neutralStems[attempt % neutralStems.length];
      const suffix = String(100 + (attempt % neutralSuffixCount));
      this.addIfValid(suggestions, blocked, `${stem}${suffix}`);
    }

    return this.asThreeSuggestions(suggestions);
  }

  private addIfValid(
    suggestions: Set<string>,
    blocked: ReadonlySet<string>,
    candidate: string,
  ) {
    const parsed = newAccountSlugSchema.safeParse(candidate);
    if (parsed.success && !blocked.has(parsed.data)) {
      suggestions.add(parsed.data);
    }
  }

  private asThreeSuggestions(suggestions: Set<string>): NicknameSuggestions {
    const values = [...suggestions];
    if (values.length !== 3) {
      throw new Error('Nickname dictionaries cannot produce three suggestions');
    }
    return [values[0], values[1], values[2]];
  }
}

export const nicknameSuggestionGenerator: NicknameSuggestionGenerator =
  new UniqueNamesNicknameSuggestionGenerator();
