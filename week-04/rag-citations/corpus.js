const corpus = [
  {
    id: "doc-llm-hallucination",
    title: "Hallucination Control",
    source: "week-01-notes",
    text:
      "LLMs can hallucinate because they generate likely text instead of verifying facts. Retrieval, citations, constrained outputs, validation, and refusal reduce hallucination risk.",
  },
  {
    id: "doc-structured-output",
    title: "Structured Output",
    source: "week-02-notes",
    text:
      "Structured output asks the model to return JSON matching a schema. The app must parse, validate, retry on invalid output, and fail safely if the response still does not match.",
  },
  {
    id: "doc-embeddings",
    title: "Embeddings",
    source: "week-03-notes",
    text:
      "Embeddings convert text into vectors. A retrieval system embeds documents and the user query, then ranks documents by vector similarity before assembling context.",
  },
  {
    id: "doc-retrieval-tuning",
    title: "Retrieval Tuning",
    source: "week-03-notes",
    text:
      "Retrieval needs tuning. topK controls how many chunks enter context, while a minimum score blocks weak matches from being treated as evidence.",
  },
  {
    id: "doc-ai-system-design",
    title: "AI System Design",
    source: "interview-notes",
    text:
      "AI system design should consider latency, cost, caching, rate limits, streaming, retries, observability, evaluation, and fallback behavior.",
  },
];

module.exports = { corpus };
