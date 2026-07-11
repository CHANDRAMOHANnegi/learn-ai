const http = require("http");
const fs = require("fs");
const path = require("path");
const { streamMockModelResponse } = require("./mock-model-provider");

const PORT = process.env.PORT || 8787;
const HOST = "127.0.0.1";
const INDEX_PATH = path.join(__dirname, "index.html");

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

  let clientClosed = false;

  req.on("close", () => {
    clientClosed = true;
  });

  for await (const chunk of streamMockModelResponse(prompt)) {
    if (clientClosed) break;

    res.write(chunk);
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
