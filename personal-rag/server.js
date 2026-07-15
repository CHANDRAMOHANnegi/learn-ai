const http = require("http");
const fs = require("fs");
const path = require("path");
const { answer, chunks, retrieve, sources } = require("./personal-rag-service");

const port = Number(process.env.PORT || 8791);
const indexPath = path.join(__dirname, "index.html");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function readJsonBody(request) {
  const body = await readRequestBody(request);
  return body ? JSON.parse(body) : {};
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(fs.readFileSync(indexPath, "utf8"));
      return;
    }

    if (request.method === "GET" && request.url === "/api/sources") {
      sendJson(response, 200, { sources });
      return;
    }

    if (request.method === "GET" && request.url === "/api/chunks") {
      sendJson(response, 200, { chunks });
      return;
    }

    if (request.method === "POST" && request.url === "/api/retrieve") {
      const payload = await readJsonBody(request);
      const question = String(payload.question || "").trim();

      if (!question) {
        sendJson(response, 400, { error: "question is required" });
        return;
      }

      sendJson(response, 200, retrieve(question, payload));
      return;
    }

    if (request.method === "POST" && request.url === "/api/answer") {
      const payload = await readJsonBody(request);
      const question = String(payload.question || "").trim();

      if (!question) {
        sendJson(response, 400, { error: "question is required" });
        return;
      }

      sendJson(response, 200, answer(question, payload));
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Personal RAG running at http://127.0.0.1:${port}`);
});
