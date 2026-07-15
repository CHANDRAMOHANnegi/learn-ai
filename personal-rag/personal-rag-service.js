const {
  createSearchIndex,
  rankDocuments,
  tokenize,
} = require("../week-03/semantic-search/embedding");
const { chunkCorpus } = require("../week-04/rag-citations/chunker");
const { sources } = require("./sources");

const chunks = chunkCorpus(sources, {
  sentencesPerChunk: 4,
  overlapSentences: 0,
});
const searchIndex = createSearchIndex(chunks);

function clampNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

function retrieve(question, options = {}) {
  const topK = clampNumber(options.topK, 4, 1, 8);
  const minScore = clampNumber(options.minScore, 0.04, 0, 1);
  const questionTokens = tokenize(question);
  const rankedChunks = rankDocuments(question, searchIndex)
    .map((chunk) => {
      const titleTokens = tokenize(chunk.title);
      const exactTitleMatches = titleTokens.filter((token) => {
        return questionTokens.includes(token);
      }).length;

      return {
        ...chunk,
        score: chunk.score + exactTitleMatches * 0.2,
      };
    })
    .sort((left, right) => right.score - left.score);
  const selectedChunks = rankedChunks
    .filter((chunk) => chunk.score >= minScore)
    .slice(0, topK)
    .map((chunk, index) => ({
      citationId: index + 1,
      id: chunk.id,
      documentId: chunk.documentId,
      title: chunk.title,
      source: chunk.source,
      updatedAt: chunk.updatedAt,
      chunkNumber: chunk.chunkNumber,
      text: chunk.text,
      score: chunk.score,
      matchedWords: chunk.matchedWords,
    }));

  return {
    question,
    questionTokens,
    selectedChunks,
    retrievalConfig: {
      topK,
      minScore,
      totalSources: sources.length,
      totalChunks: rankedChunks.length,
      selectedCount: selectedChunks.length,
    },
  };
}

function buildPrompt(question, selectedChunks) {
  const context = selectedChunks
    .map((chunk) => {
      return `[${chunk.citationId}] ${chunk.title} (${chunk.source}#chunk-${chunk.chunkNumber}): ${chunk.text}`;
    })
    .join("\n\n");

  return [
    "You are Chandramohan Negi's personal RAG assistant.",
    "Answer only using the provided context.",
    "Cite every factual claim using [number].",
    "If the context is not enough, say you do not have enough evidence.",
    "",
    "Context:",
    context || "No context selected.",
    "",
    `Question: ${question}`,
  ].join("\n");
}

function buildAnswer(question, selectedChunks) {
  if (selectedChunks.length === 0) {
    return {
      refused: true,
      answer:
        "I do not have enough evidence in Chandramohan's personal documents to answer that safely.",
      citations: [],
    };
  }

  const lowerQuestion = question.toLowerCase();
  const citations = selectedChunks.map((chunk) => ({
    citationId: chunk.citationId,
    title: chunk.title,
    source: `${chunk.source}#chunk-${chunk.chunkNumber}`,
    score: chunk.score,
  }));

  if (lowerQuestion.includes("who") || lowerQuestion.includes("summary")) {
    return {
      refused: false,
      answer:
        "Chandramohan Negi is a Bangalore-based Senior Software Engineer / Frontend Engineer with 6+ years of experience across React.js, Next.js, React Native, TypeScript, dashboards, visualization systems, testing, and AI-assisted frontend modernization workflows [1].",
      citations,
    };
  }

  if (lowerQuestion.includes("zscaler")) {
    const evidence = selectedChunks.find((chunk) => chunk.documentId === "zscaler");

    if (!evidence) {
      return {
        refused: true,
        answer:
          "I do not have enough Zscaler-specific evidence in the retrieved context to answer that safely.",
        citations: [],
      };
    }

    return {
      refused: false,
      answer: `${evidence.text} [${evidence.citationId}]`,
      citations,
    };
  }

  if (lowerQuestion.includes("mobile") || lowerQuestion.includes("react native")) {
    const evidence =
      selectedChunks.find((chunk) => chunk.documentId === "expertise-react-native") ||
      selectedChunks.find((chunk) => chunk.documentId === "mamaearth") ||
      selectedChunks[0];

    return {
      refused: false,
      answer:
        `Chandramohan's React Native/mobile evidence says: ${evidence.text} [${evidence.citationId}]`,
      citations,
    };
  }

  if (lowerQuestion.includes("learn") || lowerQuestion.includes("learning")) {
    const evidence =
      selectedChunks.find((chunk) => chunk.documentId === "learning-goals") ||
      selectedChunks[0];

    return {
      refused: false,
      answer:
        `${evidence.text} [${evidence.citationId}]`,
      citations,
    };
  }

  const citationMarkers = selectedChunks.map((chunk) => `[${chunk.citationId}]`).join(" ");

  return {
    refused: false,
    answer:
      `Based on the retrieved personal context, the most relevant evidence is: ${selectedChunks
        .map((chunk) => chunk.text)
        .join(" ")} ${citationMarkers}`,
    citations,
  };
}

function answer(question, options = {}) {
  const retrieval = retrieve(question, options);
  const generation = buildAnswer(question, retrieval.selectedChunks);

  return {
    question,
    answer: generation.answer,
    refused: generation.refused,
    citations: generation.citations,
    selectedChunks: retrieval.selectedChunks,
    retrievalConfig: retrieval.retrievalConfig,
    prompt: buildPrompt(question, retrieval.selectedChunks),
    debug: {
      questionTokens: retrieval.questionTokens,
      note:
        "This personal RAG v1 uses deterministic local generation so retrieval and citations are easy to inspect. A real version would send the prompt to an LLM.",
    },
  };
}

module.exports = {
  answer,
  buildAnswer,
  buildPrompt,
  chunks,
  retrieve,
  sources,
};
