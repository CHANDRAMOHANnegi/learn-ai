const PROFILE_SCHEMA = {
  type: "object",
  required: ["name", "role", "skills", "summary", "confidence", "missing_info"],
  properties: {
    name: { type: "string" },
    role: { type: "string" },
    skills: {
      type: "array",
      items: { type: "string" }
    },
    summary: { type: "string" },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"]
    },
    missing_info: {
      type: "array",
      items: { type: "string" }
    }
  }
};

function validateProfile(value) {
  const errors = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["response must be an object"];
  }

  for (const key of PROFILE_SCHEMA.required) {
    if (!(key in value)) errors.push(`${key} is required`);
  }

  if (typeof value.name !== "string") errors.push("name must be a string");
  if (typeof value.role !== "string") errors.push("role must be a string");
  if (!Array.isArray(value.skills)) errors.push("skills must be an array");
  if (typeof value.summary !== "string") errors.push("summary must be a string");
  if (!PROFILE_SCHEMA.properties.confidence.enum.includes(value.confidence)) {
    errors.push("confidence must be low, medium, or high");
  }
  if (!Array.isArray(value.missing_info)) {
    errors.push("missing_info must be an array");
  }

  return errors;
}

module.exports = {
  PROFILE_SCHEMA,
  validateProfile
};
