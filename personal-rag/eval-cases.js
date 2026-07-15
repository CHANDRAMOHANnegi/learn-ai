const evalCases = [
  {
    id: "zscaler-experience",
    question: "What did Chandramohan do at Zscaler?",
    options: { topK: 4, minScore: 0.04 },
    expected: {
      refused: false,
      retrievedDocumentId: "zscaler",
      citationSourceIncludes: "chandramohan_negi_resume (1).pdf#chunk-1",
      answerIncludes: ["Zscaler", "Next.js", "TypeScript"],
    },
  },
  {
    id: "react-native-experience",
    question: "What is Chandramohan's React Native experience?",
    options: { topK: 4, minScore: 0.04 },
    expected: {
      refused: false,
      retrievedAnyDocumentId: ["expertise-react-native", "mamaearth"],
      citationSourceIncludes: "chandramohan_negi_resume (1).pdf#chunk-1",
      answerIncludes: ["React Native"],
    },
  },
  {
    id: "learning-goals",
    question: "What is Chandramohan learning now?",
    options: { topK: 4, minScore: 0.04 },
    expected: {
      refused: false,
      retrievedDocumentId: "learning-goals",
      citationSourceIncludes: "user-stated-learning-goals#chunk-1",
      answerIncludes: ["frontend", "system design", "AI"],
    },
  },
  {
    id: "unsupported-payroll-policy",
    question: "What is his payroll policy?",
    options: { topK: 4, minScore: 0.4 },
    expected: {
      refused: true,
      citationCount: 0,
      answerIncludes: ["enough evidence"],
    },
  },
];

module.exports = { evalCases };
