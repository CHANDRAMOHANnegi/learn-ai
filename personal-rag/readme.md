# Personal RAG

Goal: build a RAG system that answers questions about Chandramohan from trusted personal sources.

## V1 Sources

- `chandramohan_negi_resume (1).pdf`
- user-stated learning goals from this AI learning thread

## Pipeline

```txt
personal sources
  -> clean source records
  -> chunk source records
  -> embed chunks with the local toy embedding helper
  -> retrieve matching chunks
  -> answer with citations
```

This version uses deterministic local generation so the RAG flow is easy to inspect.

## Run

```bash
node personal-rag/server.js
```

Open:

```txt
http://127.0.0.1:8791
```

API:

```bash
curl -s http://127.0.0.1:8791/api/answer \
  -H 'content-type: application/json' \
  -d '{"question":"Who is Chandramohan Negi?","topK":4,"minScore":0.04}'
```

## What This Teaches

This is RAG with your own data.

```txt
Question: What did Chandramohan do at Zscaler?
Retrieve: Zscaler resume chunk
Answer: Summarize using that chunk
Cite: chandramohan_negi_resume (1).pdf#chunk-1
```

If the question is not in the personal sources, the assistant should refuse.

## Next Improvements

- add more source docs: LinkedIn, GitHub project summaries, portfolio notes
- replace toy embeddings with a real embedding model
- replace deterministic answer generation with an LLM call
- add source freshness and permissions
- add eval questions for common interview/profile queries
