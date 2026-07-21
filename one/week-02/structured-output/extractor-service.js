const { buildExtractionPrompt } = require("./prompt-builder");
const { mockStructuredExtraction } = require("./mock-model-provider");
const { validateProfile } = require("./profile-schema");

async function extractProfile(text, options = {}) {
  const attempts = [];

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const prompt = buildExtractionPrompt(text, { attempt });
    const modelOutput = await mockStructuredExtraction(text, {
      simulateBadOutput: Boolean(options.simulateBadOutput),
      simulateSchemaError: Boolean(options.simulateSchemaError),
      attempt
    });

    try {
      const profile = JSON.parse(modelOutput);
      const validationErrors = validateProfile(profile);
      const ok = validationErrors.length === 0;

      attempts.push({
        attempt,
        ok,
        reason: ok ? "valid" : "schema validation failed",
        prompt,
        raw_model_output: modelOutput,
        errors: validationErrors
      });

      if (ok || attempt === 2) {
        return {
          status: ok ? 200 : 422,
          body: {
            profile,
            validation: {
              ok,
              errors: validationErrors
            },
            attempts
          }
        };
      }
    } catch {
      attempts.push({
        attempt,
        ok: false,
        reason: "invalid JSON",
        prompt,
        raw_model_output: modelOutput,
        errors: ["model returned invalid JSON"]
      });

      if (attempt === 2) {
        return {
          status: 502,
          body: {
            error: "Model returned invalid JSON after retry",
            validation: {
              ok: false,
              errors: ["model returned invalid JSON after retry"]
            },
            attempts
          }
        };
      }
    }
  }
}

module.exports = {
  extractProfile
};
