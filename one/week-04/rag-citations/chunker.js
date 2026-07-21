function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function chunkCorpus(corpus, options = {}) {
  const sentencesPerChunk = Math.max(Number(options.sentencesPerChunk || 1), 1);
  const overlapSentences = Math.min(
    Math.max(Number(options.overlapSentences || 0), 0),
    sentencesPerChunk - 1
  );

  return corpus.flatMap((document) => {
    const sentences = splitIntoSentences(document.text);
    const step = sentencesPerChunk - overlapSentences;
    const chunks = [];

    for (let start = 0; start < sentences.length; start += step) {
      const chunkSentences = sentences.slice(start, start + sentencesPerChunk);

      if (chunkSentences.length === 0) {
        continue;
      }

      const chunkNumber = chunks.length + 1;

      chunks.push({
        id: `${document.id}#chunk-${chunkNumber}`,
        documentId: document.id,
        title: document.title,
        source: document.source,
        updatedAt: document.updatedAt,
        chunkNumber,
        text: chunkSentences.join(" "),
      });
    }

    return chunks;
  });
}

module.exports = { chunkCorpus, splitIntoSentences };
