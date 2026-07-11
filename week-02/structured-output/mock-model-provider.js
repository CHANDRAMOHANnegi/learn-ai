function extractSkills(text) {
  const knownSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "React Native",
    "TailwindCSS",
    "Vitest",
    "Playwright",
    "Firebase",
    "Redux",
    "RAG",
    "LLM"
  ];

  return knownSkills.filter((skill) =>
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractRole(text) {
  if (/senior|sr\./i.test(text)) return "Senior Software Engineer";
  if (/frontend/i.test(text)) return "Frontend Engineer";
  if (/mobile|react native/i.test(text)) return "Mobile Engineer";
  return "Software Engineer";
}

function createProfileJson(text) {
  return {
    name: /chandramohan/i.test(text) ? "Chandramohan Negi" : "Unknown",
    role: extractRole(text),
    skills: extractSkills(text),
    summary:
      "Frontend/platform engineer with experience across web, mobile, dashboards, and AI-assisted workflows.",
    confidence: text.length > 80 ? "high" : "medium",
    missing_info: text.length > 80 ? [] : ["more detailed profile text"]
  };
}

async function mockStructuredExtraction(text) {
  // This simulates a model returning structured output.
  // In a real app this would be replaced by a model call with a JSON schema.
  return JSON.stringify(createProfileJson(text), null, 2);
}

module.exports = {
  mockStructuredExtraction
};
