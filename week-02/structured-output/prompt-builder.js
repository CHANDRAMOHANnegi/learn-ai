const { PROFILE_SCHEMA } = require("./profile-schema");

function buildExtractionPrompt(text, options = {}) {
  const strictness =
    options.attempt > 1
      ? "The previous output was invalid. Return only valid JSON. Do not include prose, markdown, or comments."
      : "Return only valid JSON. Do not include prose or markdown.";

  return {
    system:
      "You extract a candidate profile from text and return a JSON object that matches the provided schema.",
    user: text,
    schema: PROFILE_SCHEMA,
    instruction: strictness
  };
}

module.exports = {
  buildExtractionPrompt
};
