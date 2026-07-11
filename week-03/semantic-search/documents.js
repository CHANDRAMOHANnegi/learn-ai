const documents = [
  {
    id: "frontend-platform",
    title: "Frontend Platform Work",
    text:
      "A frontend platform engineer builds reusable components, design systems, dashboards, developer tooling, accessibility checks, and performance standards for product teams.",
  },
  {
    id: "rag",
    title: "RAG",
    text:
      "Retrieval augmented generation fetches relevant trusted documents before calling the model so the answer can be grounded in evidence and citations.",
  },
  {
    id: "structured-output",
    title: "Structured Output",
    text:
      "Structured output asks the model to return JSON matching a schema. The app validates the JSON and retries or fails safely when the response is invalid.",
  },
  {
    id: "embeddings",
    title: "Embeddings",
    text:
      "Embeddings turn text into vectors. Similar meaning should land near each other in vector space, which enables semantic search and retrieval.",
  },
  {
    id: "system-design",
    title: "AI System Design",
    text:
      "AI system design focuses on latency, cost, retrieval quality, caching, rate limits, streaming, evals, observability, and safe fallback behavior.",
  },
  {
    id: "hallucination",
    title: "Hallucination Control",
    text:
      "LLMs hallucinate when they produce plausible text without enough evidence. Retrieval, citations, schemas, validation, and refusal reduce this risk.",
  },
];

module.exports = { documents };
