import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root = ../../
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(REPO_ROOT, "data");
const CONFIG_PATH = path.join(DATA_DIR, "structure.config.json");
const CSV_ROOT = path.join(DATA_DIR, "csv");

const WORKER_DATA_DIR = path.join(REPO_ROOT, "worker", "src", "data");
const QUESTIONS_DIR = path.join(WORKER_DATA_DIR, "questions");
const INDEX_PATH = path.join(WORKER_DATA_DIR, "questionsIndex.js");
const STRUCTURE_OUT = path.join(WORKER_DATA_DIR, "structure.json");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Minimal CSV parser (supports quotes)
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    if (ch === "\r") continue;

    cur += ch;
  }

  // last cell
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  return rows;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function safeImportName(key) {
  // med/1/1/1/biochem -> med_1_1_1_biochem
  return key.replaceAll("/", "_").replaceAll("-", "_");
}

function main() {
  const config = readJson(CONFIG_PATH);

  // 1) write structure.json to worker (private)
  writeJson(STRUCTURE_OUT, config);

  // 2) compile questions
  const imports = [];
  const mapEntries = [];

  // traverse config
  for (const col of config.colleges || []) {
    for (const st of col.stages || []) {
      for (const tr of st.terms || []) {
        for (const co of tr.courses || []) {
          for (const sub of co.subjects || []) {
            const key = `${col.id}/${st.id}/${tr.id}/${co.id}/${sub.id}`;

            const csvPath = path.join(CSV_ROOT, col.id, st.id, tr.id, co.id, `${sub.id}.csv`);
            if (!fs.existsSync(csvPath)) {
              console.warn(`Missing CSV: ${csvPath}`);
              continue;
            }

            const raw = fs.readFileSync(csvPath, "utf8");
            const rows = parseCsv(raw).filter((r) => r.some((x) => String(x).trim().length));
            const header = rows.shift().map((h) => h.trim());

            const idx = (name) => header.indexOf(name);
            const iId = idx("id");
            const iQ = idx("question");
            const iA = idx("A");
            const iB = idx("B");
            const iC = idx("C");
            const iD = idx("D");
            const iCorrect = idx("correct");
            const iExp = idx("explanation");

            const missing = ["question","A","B","C","D","correct"].filter((k) => idx(k) === -1);
            if (missing.length) {
              throw new Error(`CSV header missing [${missing.join(", ")}] in ${csvPath}`);
            }

            const questions = rows.map((r, n) => {
              const id = (iId !== -1 ? (r[iId] || "").trim() : "") || String(n + 1);
              const q = (r[iQ] || "").trim();
              const correct = (r[iCorrect] || "").trim().toUpperCase();
              return {
                id,
                q,
                options: [
                  { k: "A", text: (r[iA] || "").trim() },
                  { k: "B", text: (r[iB] || "").trim() },
                  { k: "C", text: (r[iC] || "").trim() },
                  { k: "D", text: (r[iD] || "").trim() }
                ],
                correct: ["A","B","C","D"].includes(correct) ? correct : "A",
                explanation: iExp !== -1 ? (r[iExp] || "").trim() : ""
              };
            });

            const outPath = path.join(QUESTIONS_DIR, col.id, st.id, tr.id, co.id, `${sub.id}.json`);
            writeJson(outPath, { subjectId: sub.id, questions });

            const importName = safeImportName(key);
            const relImportPath = `./questions/${col.id}/${st.id}/${tr.id}/${co.id}/${sub.id}.json`;
            imports.push(`import ${importName} from "${relImportPath}";`);
            mapEntries.push(`  "${key}": ${importName}`);
          }
        }
      }
    }
  }

  // 3) write questionsIndex.js
  const indexJs = `import structure from "./structure.json";
${imports.join("\n")}

const MAP = {
${mapEntries.join(",\n")}
};

export { structure };

export function getQuestionsByPathKey(key) {
  return MAP[key] || null;
}
`;
  fs.writeFileSync(INDEX_PATH, indexJs, "utf8");

  console.log("✅ Data build complete:");
  console.log(" -", path.relative(REPO_ROOT, STRUCTURE_OUT));
  console.log(" -", path.relative(REPO_ROOT, INDEX_PATH));
  console.log(" - questions written under", path.relative(REPO_ROOT, QUESTIONS_DIR));
}

main();
