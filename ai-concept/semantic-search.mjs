import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const OLLAMA_URL = "http://localhost:11434/api/embed";
const EMBEDDING_MODEL = "nomic-embed-text";

const documents = [
  "JavaScript runs in web browsers and on servers through Node.js.",
  "Python is widely used for data science and machine learning.",
  "Ollama runs AI models locally on your computer.",
  "A healthy breakfast can include fruit, oats, and yogurt.",
  "Regular exercise supports cardiovascular health and improves mood.",
  "Embeddings represent the meaning of text as numerical vectors.",
];

async function embed(texts) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama returned HTTP ${response.status}: ${details}`);
  }

  const result = await response.json();
  return result.embeddings;
}

function cosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0;
  let lengthA = 0;
  let lengthB = 0;

  for (let index = 0; index < vectorA.length; index += 1) {
    dotProduct += vectorA[index] * vectorB[index];
    lengthA += vectorA[index] ** 2;
    lengthB += vectorB[index] ** 2;
  }

  if (lengthA === 0 || lengthB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(lengthA) * Math.sqrt(lengthB));
}

const readline = createInterface({ input, output });

try {
  const query = (await readline.question("What are you looking for?\n")).trim();

  if (!query) {
    throw new Error("Please enter a search query.");
  }

  const documentVectors = await embed(documents);
  const [queryVector] = await embed([query]);

  const rankedResults = documents
    .map((document, index) => ({
      document,
      score: cosineSimilarity(queryVector, documentVectors[index]),
    }))
    .sort((first, second) => second.score - first.score);

  console.log("\nMost relevant results:");
  for (const result of rankedResults.slice(0, 3)) {
    console.log(`${result.score.toFixed(3)}  ${result.document}`);
  }
} catch (error) {
  console.error(`Semantic search failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  readline.close();
}
