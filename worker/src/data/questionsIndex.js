import structure from "./structure.json";
import med_1_1_1_biochem from "./questions/med/1/1/1/biochem.json";

const MAP = {
  "med/1/1/1/biochem": med_1_1_1_biochem
};

export { structure };

export function getQuestionsByPathKey(key) {
  return MAP[key] || null;
}
