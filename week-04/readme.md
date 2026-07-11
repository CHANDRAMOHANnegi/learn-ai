# Week 4: RAG With Citations

Goal: understand how retrieval becomes a grounded answer.

## Mental Model

```txt
user question
  -> retrieve relevant chunks
  -> filter weak matches
  -> assemble context
  -> ask LLM to answer only from context
  -> return answer with citations
```

RAG means retrieval augmented generation.

Retrieval finds evidence.

Generation writes the final answer.

## RAG vs Semantic Search

Semantic search stops here:

```txt
query -> ranked documents
```

RAG continues:

```txt
query -> ranked documents -> prompt context -> cited answer
```

## Citations

Citations connect answer claims back to retrieved evidence.

They do not magically make the answer true.

They make the answer auditable.

Interview answer:

> Citations in RAG should point to the retrieved chunks used to answer. They help users and systems verify whether the answer is grounded in the supplied evidence.

## Refusal Path

If retrieval returns no strong evidence, the app should not force an answer.

Good behavior:

```txt
I do not have enough evidence in the retrieved context to answer this safely.
```

Bad behavior:

```txt
The model guesses from general knowledge while pretending it used sources.
```

## Build Target

Build a document Q&A demo with citations.

Run:

```bash
node week-04/rag-citations/server.js
```

Open:

```txt
http://127.0.0.1:8790
```

API:

```bash
curl -s http://127.0.0.1:8790/api/answer \
  -H 'content-type: application/json' \
  -d '{"question":"How should we reduce hallucination in an AI app?","topK":3,"minScore":0.08}'
```

## What To Notice In The Demo

- retrieved documents become numbered context blocks
- the generated prompt tells the model to answer only from context
- answer sentences include citation markers like `[1]`
- weak retrieval returns a refusal instead of a confident answer
- this uses a mock answer so the RAG control flow is visible

## Interview Answer

> RAG reduces hallucination by retrieving relevant trusted chunks before generation, filtering weak matches, placing the selected chunks into the prompt, and requiring the model to answer with citations. If retrieval has no strong evidence, the assistant should refuse or ask for clarification instead of guessing.
