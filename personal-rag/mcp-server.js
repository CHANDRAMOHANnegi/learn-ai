const readline = require("readline");
const { answer, retrieve, sources } = require("./personal-rag-service");

const protocolVersion = "2025-06-18";

const tools = [
  {
    name: "answer_about_chandramohan",
    description:
      "Answer a question about Chandramohan Negi using the personal RAG sources and return citations.",
    inputSchema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Question to answer from Chandramohan's personal sources.",
        },
        topK: {
          type: "number",
          description: "Maximum number of chunks to retrieve.",
          default: 4,
        },
        minScore: {
          type: "number",
          description: "Minimum similarity score needed to use a chunk.",
          default: 0.04,
        },
      },
      required: ["question"],
      additionalProperties: false,
    },
  },
  {
    name: "search_personal_profile",
    description:
      "Retrieve matching personal profile chunks without generating a final answer.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for Chandramohan's personal sources.",
        },
        topK: {
          type: "number",
          description: "Maximum number of chunks to retrieve.",
          default: 4,
        },
        minScore: {
          type: "number",
          description: "Minimum similarity score needed to return a chunk.",
          default: 0.04,
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "list_personal_sources",
    description:
      "List the trusted personal sources currently indexed by Chandramohan's personal RAG.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function resultResponse(id, result) {
  writeMessage({ jsonrpc: "2.0", id, result });
}

function errorResponse(id, code, message) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  });
}

function textContent(payload) {
  return [
    {
      type: "text",
      text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
    },
  ];
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

function callTool(name, args = {}) {
  if (name === "answer_about_chandramohan") {
    const question = requireString(args.question, "question");
    const payload = answer(question, args);

    return {
      content: textContent({
        answer: payload.answer,
        refused: payload.refused,
        citations: payload.citations,
        selectedChunks: payload.selectedChunks,
        retrievalConfig: payload.retrievalConfig,
      }),
    };
  }

  if (name === "search_personal_profile") {
    const query = requireString(args.query, "query");
    const payload = retrieve(query, args);

    return {
      content: textContent({
        query: payload.question,
        selectedChunks: payload.selectedChunks,
        retrievalConfig: payload.retrievalConfig,
      }),
    };
  }

  if (name === "list_personal_sources") {
    return {
      content: textContent({
        sources: sources.map((source) => ({
          id: source.id,
          title: source.title,
          source: source.source,
          updatedAt: source.updatedAt,
        })),
      }),
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

function handleRequest(request) {
  const { id, method, params = {} } = request;

  if (method === "initialize") {
    resultResponse(id, {
      protocolVersion,
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "chandramohan-personal-rag",
        version: "0.1.0",
      },
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    resultResponse(id, { tools });
    return;
  }

  if (method === "tools/call") {
    try {
      const toolName = requireString(params.name, "name");
      resultResponse(id, callTool(toolName, params.arguments || {}));
    } catch (error) {
      errorResponse(id, -32602, error.message);
    }
    return;
  }

  errorResponse(id, -32601, `Method not found: ${method}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  if (!line.trim()) {
    return;
  }

  try {
    handleRequest(JSON.parse(line));
  } catch (error) {
    errorResponse(null, -32700, `Parse error: ${error.message}`);
  }
});
