const {
  createSearchIndex,
  rankDocuments,
  tokenize,
} = require("../../week-03/semantic-search/embedding");
const { corpus } = require("./corpus");
const { chunkCorpus } = require("./chunker");

const chunks = chunkCorpus(corpus, {
  sentencesPerChunk: 1,
  overlapSentences: 0,
});
const searchIndex = createSearchIndex(chunks);

function retrieveContext(question, options = {}) {
  const topK = Math.min(Math.max(Number(options.topK || 3), 1), 5);
  const minScore = Math.min(Math.max(Number(options.minScore || 0.08), 0), 1);

  const rankedDocuments = rankDocuments(question, searchIndex);
  const selectedChunks = rankedDocuments
    .filter((chunk) => chunk.score >= minScore)
    .slice(0, topK)
    .map((chunk, index) => ({
      citationId: index + 1,
      id: chunk.id,
      documentId: chunk.documentId,
      title: chunk.title,
      source: chunk.source,
      chunkNumber: chunk.chunkNumber,
      text: chunk.text,
      score: chunk.score,
      matchedWords: chunk.matchedWords,
    }));

  return {
    question,
    questionTokens: tokenize(question),
    selectedDocuments: selectedChunks,
    selectedChunks,
    retrievalConfig: {
      topK,
      minScore,
      totalDocuments: corpus.length,
      totalChunks: rankedDocuments.length,
      selectedCount: selectedChunks.length,
    },
  };
}

function buildPrompt(question, selectedChunks) {
  const contextBlock = selectedChunks
    .map((chunk) => {
      return `[${chunk.citationId}] ${chunk.title} (${chunk.source}#chunk-${chunk.chunkNumber}): ${chunk.text}`;
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

function generateGroundedAnswer(question, selectedChunks) {
  if (selectedChunks.length === 0) {
    return {
      answer:
        "I do not have enough evidence in the retrieved context to answer this safely.",
      citations: [],
      refused: true,
    };
  }

  const citationList = selectedChunks.map((chunk) => `[${chunk.citationId}]`);
  const firstCitation = citationList[0];
  const secondCitation = citationList[1] || firstCitation;

  return {
    answer:
      `Use retrieval to fetch trusted context before generation ${firstCitation}. ` +
      `Then keep only strong matches using topK and a minimum score so weak evidence is not treated as truth ${secondCitation}. ` +
      `The final answer should cite the retrieved sources and refuse when context is missing ${firstCitation}.`,
    citations: selectedChunks.map((chunk) => ({
      citationId: chunk.citationId,
      title: chunk.title,
      source: `${chunk.source}#chunk-${chunk.chunkNumber}`,
      score: chunk.score,
    })),
    refused: false,
  };
}

function answerQuestion(question, options = {}) {
  const retrieval = retrieveContext(question, options);
  const prompt = buildPrompt(question, retrieval.selectedChunks);
  const generation = generateGroundedAnswer(question, retrieval.selectedChunks);

  return {
    question,
    answer: generation.answer,
    refused: generation.refused,
    citations: generation.citations,
    selectedDocuments: retrieval.selectedChunks,
    selectedChunks: retrieval.selectedChunks,
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
  chunks,
  generateGroundedAnswer,
  retrieveContext,
};
