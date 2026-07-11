# Week 2: Prompting And Structured Output

Goal: learn how AI apps force model output into predictable data.

## Mental Model

Normal LLM output:

```txt
The candidate looks like a strong frontend engineer...
```

Structured output:

```json
{
  "name": "Chandramohan Negi",
  "role": "Senior Software Engineer",
  "skills": ["React", "Next.js", "TypeScript"],
  "confidence": "high",
  "missing_info": []
}
```

Why this matters:

- UI can render fields safely
- backend can validate shape
- invalid responses can be rejected or retried
- downstream systems can consume the result

## Build: Structured Profile Extractor

Path:

```txt
week-02/structured-output/
  index.html
  server.js
  mock-model-provider.js
  profile-schema.js
  prompt-builder.js
```

Run:

```bash
node week-02/structured-output/server.js
```

Open:

```txt
http://127.0.0.1:8788
```

Flow:

```txt
profile text
-> POST /api/extract
-> mock model returns JSON string
-> backend parses JSON
-> backend validates schema
-> UI shows profile + validation result
```

## Prompt And Schema Boundary

The app now separates the contract from the route:

```txt
prompt-builder.js
-> builds system instruction, user input, schema, and retry instruction

profile-schema.js
-> owns the expected JSON shape and validation rules

server.js
-> calls prompt builder, model provider, parser, and validator
```

This is the production mental model:

```txt
schema contract
-> prompt builder
-> model call
-> parse JSON
-> validate schema
-> retry or return controlled result
```

System vs user prompt:

- system prompt defines the assistant's job and rules
- user prompt contains the actual text/input to process
- schema defines the exact output contract

Interview answer:

> I separate system instructions, user input, and schema. The system prompt defines the task and constraints, the user prompt provides the data, and the schema defines the output contract. The backend still validates the result because prompts are not a guarantee.

## Retry On Bad Output

The app includes a checkbox:

```txt
Simulate bad model output, then retry
```

It also includes:

```txt
Simulate valid JSON with wrong schema, then retry
```

When enabled:

```txt
attempt 1 -> model returns malformed JSON
backend JSON.parse fails
backend records the failed attempt
attempt 2 -> backend asks again with stricter expectations
backend parses and validates the final JSON
```

There are two different failure modes:

```txt
invalid JSON
-> JSON.parse fails

valid JSON, wrong schema
-> JSON.parse succeeds
-> schema validation fails
```

Production lesson:

- never trust model output blindly
- parse the output
- validate the schema
- retry once or twice with a stricter instruction
- if it still fails, return a controlled error

Retry interview answer:

> If a model returns invalid structured output, I would not pass it directly to the UI or database. First I would parse it as JSON. Then I would validate it against the expected schema. If parsing or validation fails, I would retry with a stricter prompt or schema instruction and return a controlled error if it still fails.

## Interview Answer

> Structured output means asking the model to return data in a fixed schema, usually JSON. The application should still parse and validate it, because model output can be malformed or missing required fields. If validation fails, we can retry, repair, or ask the user for missing information.
