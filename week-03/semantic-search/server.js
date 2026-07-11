const http = require("http");
const fs = require("fs");
const path = require("path");
const { documents } = require("./documents");
const { createSearchIndex, rankDocuments, tokenize } = require("./embedding");

const port = Number(process.env.PORT || 8789);
const indexPath = path.join(__dirname, "index.html");
const searchIndex = createSearchIndex(documents);

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

async function handleSearch(request, response) {
  const body = await readRequestBody(request);
  const payload = body ? JSON.parse(body) : {};
  const query = String(payload.query || "").trim();

  if (!query) {
    sendJson(response, 400, { error: "query is required" });
    return;
  }

  const rankedDocuments = rankDocuments(query, searchIndex);

  sendJson(response, 200, {
    query,
    queryTokens: tokenize(query),
    topResults: rankedDocuments.slice(0, 4),
    debug: {
      vocabularySize: searchIndex.vocabulary.length,
      vocabulary: searchIndex.vocabulary,
      note:
        "This demo uses a transparent bag-of-words vector so you can see the mechanics. Real embeddings use dense numeric vectors learned by a model.",
    },
  });
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(fs.readFileSync(indexPath, "utf8"));
      return;
    }

    if (request.method === "GET" && request.url === "/api/documents") {
      sendJson(response, 200, { documents });
      return;
    }

    if (request.method === "POST" && request.url === "/api/search") {
      await handleSearch(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Week 3 semantic search demo running at http://127.0.0.1:${port}`);
});
