export type JSON_CONFIG = { info: Entry[] };
export interface Entry {
  note: string;
  scope: string[];
  pattern: Pattern;
}
export enum PatternType {
  regex = "regex",
  ai = "ai",
  custom = "custom",
}
export interface Pattern {
  type: PatternType;
  thingToLookFor: string;
}
