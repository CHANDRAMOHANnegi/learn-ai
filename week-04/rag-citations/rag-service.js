const {
  createSearchIndex,
  rankDocuments,
  tokenize,
} = require("../../week-03/semantic-search/embedding");
const { corpus } = require("./corpus");

const searchIndex = createSearchIndex(corpus);

function retrieveContext(question, options = {}) {
  const topK = Math.min(Math.max(Number(options.topK || 3), 1), 5);
  const minScore = Math.min(Math.max(Number(options.minScore || 0.08), 0), 1);

  const rankedDocuments = rankDocuments(question, searchIndex);
  const selectedDocuments = rankedDocuments
    .filter((document) => document.score >= minScore)
    .slice(0, topK)
    .map((document, index) => ({
      citationId: index + 1,
      id: document.id,
      title: document.title,
      source: document.source,
      text: document.text,
      score: document.score,
      matchedWords: document.matchedWords,
    }));

  return {
    question,
    questionTokens: tokenize(question),
    selectedDocuments,
    retrievalConfig: {
      topK,
      minScore,
      totalDocuments: rankedDocuments.length,
      selectedCount: selectedDocuments.length,
    },
  };
}

function buildPrompt(question, selectedDocuments) {
  const contextBlock = selectedDocuments
    .map((document) => {
      return `[${document.citationId}] ${document.title} (${document.source}): ${document.text}`;
    })
    .join("\n\n");

  return [
    "You are a careful AI interview assistant.",
    "Answer only using the provided context.",
    "Cite every factual claim using [number].",
    "If the context is insufficient, say you do not have enough evidence.",
    "",
    "Context:",
    contextBlock || "No context selected.",
    "",
    `Question: ${question}`,
  ].join("\n");
}

function generateGroundedAnswer(question, selectedDocuments) {
  if (selectedDocuments.length === 0) {
    return {
      answer:
        "I do not have enough evidence in the retrieved context to answer this safely.",
      citations: [],
      refused: true,
    };
  }

  const citationList = selectedDocuments.map((document) => `[${document.citationId}]`);
  const firstCitation = citationList[0];
  const secondCitation = citationList[1] || firstCitation;

  return {
    answer:
      `Use retrieval to fetch trusted context before generation ${firstCitation}. ` +
      `Then keep only strong matches using topK and a minimum score so weak evidence is not treated as truth ${secondCitation}. ` +
      `The final answer should cite the retrieved sources and refuse when context is missing ${firstCitation}.`,
    citations: selectedDocuments.map((document) => ({
      citationId: document.citationId,
      title: document.title,
      source: document.source,
      score: document.score,
    })),
    refused: false,
  };
}

function answerQuestion(question, options = {}) {
  const retrieval = retrieveContext(question, options);
  const prompt = buildPrompt(question, retrieval.selectedDocuments);
  const generation = generateGroundedAnswer(question, retrieval.selectedDocuments);

  return {
    question,
    answer: generation.answer,
    refused: generation.refused,
    citations: generation.citations,
    selectedDocuments: retrieval.selectedDocuments,
    retrievalConfig: retrieval.retrievalConfig,
    prompt,
    debug: {
      questionTokens: retrieval.questionTokens,
      note:
        "This demo uses a deterministic mock answer so the RAG control flow is visible. In production, the prompt would be sent to an LLM.",
    },
  };
}

module.exports = {
  answerQuestion,
  buildPrompt,
  generateGroundedAnswer,
  retrieveContext,
};
