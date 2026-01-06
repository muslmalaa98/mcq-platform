import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CODES_TXT = path.join(__dirname, "..", "codes.txt");

function sha256Hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function main() {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper) {
    console.error("❌ Please set AUTH_PEPPER in your terminal before running:");
    console.error('   PowerShell:  $env:AUTH_PEPPER="your-strong-secret"');
    process.exit(1);
  }

  if (!fs.existsSync(CODES_TXT)) {
    console.error("❌ Missing file:", CODES_TXT);
    console.error("Create worker/codes.txt (one code per line). Do NOT commit it.");
    process.exit(1);
  }

  const codes = fs.readFileSync(CODES_TXT, "utf8")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  console.log("✅ Generated KV put commands (run inside worker/):");
  console.log("   (If your wrangler uses new syntax, replace 'kv:key' with 'kv key')");
  console.log("");

  for (const code of codes) {
    const h = sha256Hex(`${code}:${pepper}`);
    console.log(`wrangler kv:key put --binding=CODES "codehash:${h}" "1"`);
  }

  console.log("");
  console.log("Tip: keep your pepper secret using: wrangler secret put AUTH_PEPPER");
}

main();
