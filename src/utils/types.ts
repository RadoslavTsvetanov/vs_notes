export type JSON_CONFIG = { info: Entry[] };
export interface Entry {
  note: string;
  scope: string[];
  pattern: Pattern;
}
export enum PattrenType {
  regex = "regex",
  ai = "ai",
}
export interface Pattern {
  type: PattrenType;
  thingToLookFor: string;
}
