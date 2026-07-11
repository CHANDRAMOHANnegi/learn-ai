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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* streamMockModelResponse(prompt) {
  const answer = chooseAnswer(prompt);
  const chunks = answer.split(/(\s+)/);

  for (const chunk of chunks) {
    await sleep(55);
    yield chunk;
  }
}

module.exports = {
  streamMockModelResponse
};
