const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const HOST = "127.0.0.1";
const INDEX_PATH = path.join(__dirname, "index.html");

const answers = [
  {
    match: ["token", "tokens"],
    text:
      "A token is the unit an LLM reads and writes. In a real API, input size, output size, cost, and latency are usually measured in tokens."
  },
  {
    match: ["stream", "streaming"],
    text:
      "Streaming means the server sends partial output chunks as soon as they are available. The browser reads those chunks and updates the UI without waiting for the full answer."
  },
  {
    match: ["frontend", "ui", "react"],
    text:
      "The frontend should treat an AI response as progressive state. First create an empty assistant message, then append each incoming chunk to that same message."
  },
  {
    match: ["rag", "retrieval"],
    text:
      "In a RAG app, the backend first retrieves relevant chunks from trusted documents, then includes those chunks in the model request before streaming the final answer."
  }
];

function chooseAnswer(prompt) {
  const normalized = prompt.toLowerCase();
  const hit = answers.find((answer) =>
    answer.match.some((word) => normalized.includes(word))
  );

  if (hit) return hit.text;

  return (
    "This server is a mock LLM endpoint. The important pattern is browser -> POST /api/chat -> backend streams chunks -> frontend appends chunks into one assistant message."
  );
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleChat(req, res) {
  const rawBody = await readRequestBody(req);
  let prompt = "";

  try {
    const parsed = JSON.parse(rawBody);
    prompt = String(parsed.prompt || "");
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  if (!prompt.trim()) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Prompt is required" }));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
    "Transfer-Encoding": "chunked"
  });

  const answer = chooseAnswer(prompt);
  const chunks = answer.split(/(\s+)/);
  let clientClosed = false;

  req.on("close", () => {
    clientClosed = true;
  });

  for (const chunk of chunks) {
    if (clientClosed) break;

    res.write(chunk);
    await sleep(55);
  }

  if (!clientClosed) {
    res.end();
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      });
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(INDEX_PATH, "utf8"));
      return;
    }

    if (req.method === "POST" && req.url === "/api/chat") {
      await handleChat(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server error" }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Streaming server running at http://${HOST}:${PORT}`);
});
