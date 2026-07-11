const http = require("http");
const fs = require("fs");
const path = require("path");
const { buildExtractionPrompt } = require("./prompt-builder");
const { mockStructuredExtraction } = require("./mock-model-provider");
const { validateProfile } = require("./profile-schema");

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

async function handleExtract(req, res) {
  const rawBody = await readRequestBody(req);
  let text = "";
  let simulateBadOutput = false;
  let simulateSchemaError = false;

  try {
    const parsed = JSON.parse(rawBody);
    text = String(parsed.text || "");
    simulateBadOutput = Boolean(parsed.simulateBadOutput);
    simulateSchemaError = Boolean(parsed.simulateSchemaError);
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

  const attempts = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const prompt = buildExtractionPrompt(text, { attempt });
    const modelOutput = await mockStructuredExtraction(text, {
      simulateBadOutput,
      simulateSchemaError,
      attempt
    });

    try {
      const profile = JSON.parse(modelOutput);
      const validationErrors = validateProfile(profile);
      const ok = validationErrors.length === 0;

      attempts.push({
        attempt,
        ok,
        reason: ok ? "valid" : "schema validation failed",
        prompt,
        raw_model_output: modelOutput,
        errors: validationErrors
      });

      if (ok || attempt === 2) {
        res.writeHead(ok ? 200 : 422, {
          "Content-Type": "application/json"
        });
        res.end(
          JSON.stringify(
            {
              profile,
              validation: {
                ok,
                errors: validationErrors
              },
              attempts
            },
            null,
            2
          )
        );
        return;
      }
    } catch {
      attempts.push({
        attempt,
        ok: false,
        reason: "invalid JSON",
        prompt,
        raw_model_output: modelOutput,
        errors: ["model returned invalid JSON"]
      });

      if (attempt === 2) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify(
            {
              error: "Model returned invalid JSON after retry",
              validation: {
                ok: false,
                errors: ["model returned invalid JSON after retry"]
              },
              attempts
            },
            null,
            2
          )
        );
        return;
      }
    }
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
