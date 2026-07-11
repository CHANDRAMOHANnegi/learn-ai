# Week 3: Embeddings And Semantic Search

Goal: understand embeddings well enough to explain RAG retrieval in interviews.

## Mental Model

```txt
text -> embedding model -> vector
query vector + document vectors -> similarity score -> ranked results
```

An embedding is a numeric representation of meaning.

In a real AI app, the embedding model is trained so similar meaning lands near similar vectors.

In this local demo, we use a simple bag-of-words vector so the mechanics are visible.

## Why Embeddings Matter

Keyword search asks:

```txt
Do these exact words match?
```

Semantic search asks:

```txt
Is this document close to the query in meaning?
```

This is why embeddings are usually the first step before RAG.

## Cosine Similarity

Cosine similarity compares the direction of two vectors.

Interview answer:

> Cosine similarity measures how close two vectors point in the same direction. For embeddings, a higher cosine similarity usually means the query and document are more semantically related.

## Vector Search Flow

```txt
1. Split trusted content into documents or chunks.
2. Embed every chunk.
3. Store vectors in a vector index or vector database.
4. Embed the user's query.
5. Retrieve the top matching chunks by similarity.
6. Send those chunks to the LLM as context.
```

## Important Interview Distinction

Embeddings do not answer the user.

They help choose what context should be sent to the model.

```txt
embedding search = find relevant evidence
LLM generation = write the final answer using that evidence
```

## Build Target

Build a semantic search demo over local notes.

Run:

```bash
node week-03/semantic-search/server.js
```

Open:

```txt
http://127.0.0.1:8789
```

API:

```bash
curl -s http://127.0.0.1:8789/api/search \
  -H 'content-type: application/json' \
  -d '{"query":"how do we reduce hallucination with evidence"}'
```

## What To Notice In The Demo

- each document is embedded once at server startup
- the user query is embedded on each search
- cosine similarity gives every document a score
- the UI sorts by score
- the debug panel shows why this toy version matched words
- `topK` controls how many documents are allowed into context
- `minScore` blocks weak matches from being sent to the model

## Retrieval Tuning

In interviews, do not say "we retrieve documents" as if retrieval is always correct.

Retrieval needs tuning:

```txt
topK = maximum number of chunks to return
minScore = minimum similarity score needed to trust a chunk
```

If `topK` is too low, the answer may miss needed context.

If `topK` is too high, the model receives noisy context.

If `minScore` is too low, weak evidence can cause hallucination.

If `minScore` is too high, the app may refuse even when useful context exists.

Interview answer:

> In retrieval, I tune topK and similarity thresholds. topK controls how much context we send, while a minimum score prevents weak matches from being treated as evidence. If no chunk crosses the threshold, the assistant should ask for clarification or say it does not have enough evidence.

## Interview Answer

> Embeddings convert text into vectors so similar meaning can be searched by distance or similarity. In RAG, we embed documents, store those vectors, embed the user query, retrieve the most similar chunks, and pass only those chunks to the LLM as grounded context.
