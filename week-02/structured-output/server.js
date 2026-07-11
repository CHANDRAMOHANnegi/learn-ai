const http = require("http");
const fs = require("fs");
const path = require("path");
const { mockStructuredExtraction } = require("./mock-model-provider");

const PORT = process.env.PORT || 8788;
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

function validateProfile(value) {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["response must be an object"];
  }

  if (typeof value.name !== "string") errors.push("name must be a string");
  if (typeof value.role !== "string") errors.push("role must be a string");
  if (!Array.isArray(value.skills)) errors.push("skills must be an array");
  if (typeof value.summary !== "string") errors.push("summary must be a string");
  if (!["low", "medium", "high"].includes(value.confidence)) {
    errors.push("confidence must be low, medium, or high");
  }
  if (!Array.isArray(value.missing_info)) {
    errors.push("missing_info must be an array");
  }

  return errors;
}

async function handleExtract(req, res) {
  const rawBody = await readRequestBody(req);
  let text = "";

  try {
    const parsed = JSON.parse(rawBody);
    text = String(parsed.text || "");
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  if (!text.trim()) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Text is required" }));
    return;
  }

  const modelOutput = await mockStructuredExtraction(text);

  try {
    const profile = JSON.parse(modelOutput);
    const validationErrors = validateProfile(profile);

    res.writeHead(validationErrors.length ? 422 : 200, {
      "Content-Type": "application/json"
    });
    res.end(
      JSON.stringify(
        {
          profile,
          validation: {
            ok: validationErrors.length === 0,
            errors: validationErrors
          },
          raw_model_output: modelOutput
        },
        null,
        2
      )
    );
  } catch {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Model returned invalid JSON",
        raw_model_output: modelOutput
      })
    );
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(INDEX_PATH, "utf8"));
      return;
    }

    if (req.method === "POST" && req.url === "/api/extract") {
      await handleExtract(req, res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server error" }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Structured output server running at http://${HOST}:${PORT}`);
});
