import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL = "llama3.2";

const requiredFields = [
  "customer",
  "product",
  "price",
  "order_date",
  "delivery_city",
  "delivery_date",
];

async function callOllama(text) {
  const prompt = `
Extract information from the text below.

Return one JSON object with exactly these fields:
- customer: string or null
- product: string or null
- price: number or null
- order_date: string or null
- delivery_city: string or null
- delivery_date: string or null

Rules:
- Use only information stated in the input.
- Use null when information is missing.
- Do not guess.
- Return JSON only, without Markdown or explanation.

Input text:
${text}
  `.trim();

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      format: "json",
      stream: false,
      options: { temperature: 0 },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama returned HTTP ${response.status}: ${details}`);
  }

  const result = await response.json();
  return result.response;
}

function validate(data) {
  if (data === null || Array.isArray(data) || typeof data !== "object") {
    throw new Error("The model did not return a JSON object.");
  }

  const missingFields = requiredFields.filter((field) => !(field in data));
  if (missingFields.length > 0) {
    throw new Error(`Missing fields: ${missingFields.join(", ")}`);
  }

  return Object.fromEntries(
    requiredFields.map((field) => [field, data[field]]),
  );
}

const readline = createInterface({ input, output });

try {
  const text = (await readline.question("Enter an order description:\n")).trim();

  if (!text) {
    console.log("Please provide an order description.");
    process.exitCode = 1;
  } else {
    const modelOutput = await callOllama(text);
    console.log(modelOutput);

    const extractedData = validate(JSON.parse(modelOutput));

    console.log("\nValidated information:");
    console.log(JSON.stringify(extractedData, null, 2));
  }
} catch (error) {
  console.error(`Could not extract information: ${error.message}`);
  process.exitCode = 1;
} finally {
  readline.close();
}
