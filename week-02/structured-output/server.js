const http = require("http");
const fs = require("fs");
const path = require("path");
const { EVAL_CASES } = require("./eval-cases");
const { extractProfile } = require("./extractor-service");

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

  const result = await extractProfile(text, {
    simulateBadOutput,
    simulateSchemaError
  });

  res.writeHead(result.status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result.body, null, 2));
}

function includesAll(actual = [], expected = []) {
  return expected.every((item) => actual.includes(item));
}

async function handleEvals(req, res) {
  const results = [];

  for (const testCase of EVAL_CASES) {
    const result = await extractProfile(testCase.text);
    const profile = result.body.profile || {};
    const checks = [];

    if (testCase.expected.name) {
      checks.push({
        name: "name",
        pass: profile.name === testCase.expected.name,
        expected: testCase.expected.name,
        actual: profile.name
      });
    }

    if (testCase.expected.role) {
      checks.push({
        name: "role",
        pass: profile.role === testCase.expected.role,
        expected: testCase.expected.role,
        actual: profile.role
      });
    }

    if (testCase.expected.skills) {
      checks.push({
        name: "skills",
        pass: includesAll(profile.skills, testCase.expected.skills),
        expected: testCase.expected.skills,
        actual: profile.skills
      });
    }

    if (testCase.expected.missing_info_includes) {
      checks.push({
        name: "missing_info",
        pass: (profile.missing_info || []).includes(
          testCase.expected.missing_info_includes
        ),
        expected: testCase.expected.missing_info_includes,
        actual: profile.missing_info
      });
    }

    results.push({
      id: testCase.id,
      pass: result.body.validation.ok && checks.every((check) => check.pass),
      checks,
      profile
    });
  }

  const passed = results.filter((result) => result.pass).length;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify(
      {
        passed,
        total: results.length,
        ok: passed === results.length,
        results
      },
      null,
      2
    )
  );
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

    if (req.method === "GET" && req.url === "/api/evals") {
      await handleEvals(req, res);
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
