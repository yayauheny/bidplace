export type NicknameSuggestions = readonly [string, string, string];

export interface NicknameSuggestionGenerator {
  generate(excluded?: readonly string[]): NicknameSuggestions;
}
