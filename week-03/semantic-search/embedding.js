const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "before",
  "can",
  "do",
  "does",
  "for",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "should",
  "so",
  "the",
  "this",
  "to",
  "we",
  "what",
  "when",
  "why",
  "with",
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function buildVocabulary(texts) {
  const vocabulary = [];
  const seen = new Set();

  for (const text of texts) {
    for (const token of tokenize(text)) {
      if (!seen.has(token)) {
        seen.add(token);
        vocabulary.push(token);
      }
    }
  }

  return vocabulary.sort();
}

function embedText(text, vocabulary) {
  const counts = new Map();

  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return vocabulary.map((word) => counts.get(word) || 0);
}

function cosineSimilarity(leftVector, rightVector) {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < leftVector.length; index += 1) {
    dotProduct += leftVector[index] * rightVector[index];
    leftMagnitude += leftVector[index] * leftVector[index];
    rightMagnitude += rightVector[index] * rightVector[index];
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function createSearchIndex(documents) {
  const vocabulary = buildVocabulary(documents.map((document) => document.text));
  const indexedDocuments = documents.map((document) => ({
    ...document,
    vector: embedText(document.text, vocabulary),
  }));

  return { vocabulary, indexedDocuments };
}

function rankDocuments(query, searchIndex) {
  const queryVector = embedText(query, searchIndex.vocabulary);

  return searchIndex.indexedDocuments
    .map((document) => {
      const { vector, ...metadata } = document;

      return {
        ...metadata,
        score: cosineSimilarity(queryVector, vector),
        matchedWords: searchIndex.vocabulary.filter((word, index) => {
          return queryVector[index] > 0 && vector[index] > 0;
        }),
      };
    })
    .sort((left, right) => right.score - left.score);
}

module.exports = {
  buildVocabulary,
  cosineSimilarity,
  createSearchIndex,
  embedText,
  rankDocuments,
  tokenize,
};
