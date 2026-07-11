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

## Interview Answer

> Structured output means asking the model to return data in a fixed schema, usually JSON. The application should still parse and validate it, because model output can be malformed or missing required fields. If validation fails, we can retry, repair, or ask the user for missing information.

