import { promises as fs } from "node:fs";
import path from "node:path";
import { createDemoSeed } from "@/lib/data/demo-seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "demo.json");

let writeChain = Promise.resolve();

async function readStore() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      const seed = createDemoSeed();
      await persist(seed);
      return seed;
    }
    throw error;
  }
}

async function persist(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function enqueue(mutator) {
  const run = writeChain.then(async () => {
    const data = await readStore();
    const result = await mutator(data);
    await persist(data);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function getDemoStore() {
  return readStore();
}

export function updateDemoStore(mutator) {
  return enqueue(mutator);
}
