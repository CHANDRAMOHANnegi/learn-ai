const { answer } = require("./personal-rag-service");
const { evalCases } = require("./eval-cases");

function includesIgnoreCase(text, expected) {
  return text.toLowerCase().includes(expected.toLowerCase());
}

function assertCase(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function evaluateCase(testCase) {
  const payload = answer(testCase.question, testCase.options);
  const failures = [];
  const expected = testCase.expected;

  if (typeof expected.refused === "boolean") {
    assertCase(
      payload.refused === expected.refused,
      `expected refused=${expected.refused}, got ${payload.refused}`,
      failures
    );
  }

  if (expected.retrievedDocumentId) {
    assertCase(
      payload.selectedChunks.some((chunk) => {
        return chunk.documentId === expected.retrievedDocumentId;
      }),
      `expected retrieved document ${expected.retrievedDocumentId}`,
      failures
    );
  }

  if (expected.retrievedAnyDocumentId) {
    assertCase(
      payload.selectedChunks.some((chunk) => {
        return expected.retrievedAnyDocumentId.includes(chunk.documentId);
      }),
      `expected one of retrieved documents ${expected.retrievedAnyDocumentId.join(", ")}`,
      failures
    );
  }

  if (expected.citationSourceIncludes) {
    assertCase(
      payload.citations.some((citation) => {
        return citation.source.includes(expected.citationSourceIncludes);
      }),
      `expected citation source containing ${expected.citationSourceIncludes}`,
      failures
    );
  }

  if (typeof expected.citationCount === "number") {
    assertCase(
      payload.citations.length === expected.citationCount,
      `expected ${expected.citationCount} citations, got ${payload.citations.length}`,
      failures
    );
  }

  for (const phrase of expected.answerIncludes || []) {
    assertCase(
      includesIgnoreCase(payload.answer, phrase),
      `expected answer to include "${phrase}"`,
      failures
    );
  }

  return {
    id: testCase.id,
    passed: failures.length === 0,
    failures,
    answer: payload.answer,
    citations: payload.citations,
    selectedDocumentIds: payload.selectedChunks.map((chunk) => chunk.documentId),
  };
}

function runEvals() {
  const results = evalCases.map(evaluateCase);
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  for (const result of results) {
    const marker = result.passed ? "PASS" : "FAIL";
    console.log(`${marker} ${result.id}`);

    for (const failure of result.failures) {
      console.log(`  - ${failure}`);
    }
  }

  console.log("");
  console.log(`Result: ${passed}/${results.length} passed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runEvals();
