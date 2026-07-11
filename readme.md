# Learn AI

Goal: learn AI as a frontend/platform engineer preparing for interviews.

Primary direction:

```txt
LLM basics -> prompting -> embeddings -> RAG -> tools -> agents -> AI system design -> interview polish
```

This repo should stay practical. Every concept should connect to a small runnable artifact or interview answer.

## Repo Structure

```txt
week-01/
  browser-mock-streaming/
    index.html
  backend-streaming/
    index.html
    server.js
  readme.md
```

Run the Week 1 backend streaming demo:

```bash
node week-01/backend-streaming/server.js
```

Open:

```txt
http://127.0.0.1:8787
```

## 8-Week Interview-Focused Plan

### Week 1: LLM Fundamentals

Learn:

- tokens
- context window
- temperature
- hallucination
- training vs inference
- RAG vs fine-tuning
- streaming UI basics

Interview questions:

- What is a token?
- What is a context window?
- Why do LLMs hallucinate?
- What is training vs inference?
- What is RAG vs fine-tuning?
- Why do AI apps stream responses?

Build:

- streaming chat UI
- then backend streaming endpoint

### Week 2: Prompting And Structured Output

Learn:

- system prompt vs user prompt
- output schemas
- JSON validation
- retry when output is invalid
- deterministic extraction

Build:

- resume/profile extractor that returns strict JSON

### Week 3: Embeddings

Learn:

- embeddings
- semantic similarity
- cosine similarity
- vector search mental model

Build:

- semantic search over notes/resume/docs

### Week 4: RAG

Learn:

- chunking
- retrieval
- citations
- context assembly
- hallucination control

Build:

- document Q&A with citations

### Week 5: Tool Calling

Learn:

- function/tool schemas
- model deciding when to call tools
- tool errors
- tool result validation

Build:

- assistant that can call search/profile/code-analysis functions

### Week 6: Agents

Learn:

- planning
- multi-step workflows
- memory
- human approval
- agent failure modes

Build:

- AI frontend reviewer

### Week 7: AI System Design

Practice:

- ChatGPT-like app
- resume Q&A app
- AI code reviewer
- customer support AI agent
- internal knowledge-base RAG system

Focus areas:

- latency
- cost
- caching
- rate limits
- queues
- streaming
- evals
- observability

### Week 8: Interview Revision And Portfolio Polish

Polish one main project:

- AI Frontend Mentor

It should review React code for:

- accessibility
- performance
- architecture
- state management
- suggested patches

## Week 1 Notes

### Core Mental Model

```txt
instructions + user input + relevant context -> model -> generated output
```

An LLM is not a database. It generates likely text from the prompt/context it receives.

### Token

A token is the unit an LLM reads and writes. It can be a word, part of a word, punctuation, or spacing.

Interview answer:

> Tokens are the model's input and output units. Context window, cost, latency, and output limits are usually measured in tokens.

### Context Window

The context window is the maximum amount of information the model can consider in one request.

Interview answer:

> If the useful information is outside the context window, the model cannot use it. Long apps solve this with retrieval, summarization, memory, or context pruning.

### Temperature

Temperature controls randomness.

- Low temperature: stable, deterministic, better for extraction/classification/code review.
- High temperature: varied, creative, better for brainstorming/copywriting.

### Hallucination

Hallucination means the model produces plausible-looking but unsupported or false information.

Interview answer:

> LLMs hallucinate because they generate likely next tokens, not because they verify facts against a source of truth. We reduce hallucination using retrieval, citations, constrained outputs, validation, and refusal when evidence is missing.

### Retrieval

Retrieval means fetching relevant information from a trusted source before asking the model to answer.

Flow:

```txt
user question -> search relevant docs -> give docs to LLM -> LLM answers from docs
```

### Citations

Citations show where the answer came from.

Example:

```txt
Source: resume.pdf, page 1
Source: refund-policy.md, section 3
```

### Constrained Outputs

Constrained output means forcing a fixed response shape, usually JSON.

Example:

```json
{
  "name": "Chandramohan Negi",
  "role": "Senior Software Engineer",
  "skills": ["React", "Next.js", "TypeScript", "React Native"],
  "confidence": "high",
  "missing_info": []
}
```

This helps the app validate, reject, or retry bad responses.

### Training vs Inference

Training is when the model learns from data and updates its weights.

Inference is when we use the already-trained model to generate an answer.

Interview answer:

> Training is the process where a model learns from data by updating its weights. Inference is the process of using the trained model to generate an output for a given prompt. In most AI applications, we are doing inference, not training.

### RAG vs Fine-Tuning

```txt
RAG = give the model knowledge at request time
Fine-tuning = train the model to behave differently
```

Interview answer:

> RAG retrieves external knowledge at request time and gives it to the model as context. Fine-tuning updates the model using training examples so it follows a specific behavior or style more reliably. Use RAG for fresh, private, source-backed knowledge. Use fine-tuning for repeated task behavior, tone, or output style.

Memorize:

> If the issue is "the model does not know the information," use RAG. If the issue is "the model does not behave the way we want," consider fine-tuning.

## Week 1 Build Target: Streaming Chat

### Browser-Only Mock Streaming

The first version can simulate streaming fully in the browser.

Flow:

```txt
submit form
-> create user message
-> create empty assistant message
-> split answer into token-like pieces
-> append one token at a time
-> re-render UI after every token
-> stop button can interrupt
```

Important functions:

- `createMessage(role, text)` stores user/assistant messages.
- `renderMessages(activeAssistantMessage)` paints the current conversation.
- `streamAnswer(prompt)` simulates token streaming.
- `setStreamingState(nextIsStreaming)` controls loading, disabled inputs, and stop state.

Interview answer:

> Streaming means the frontend renders partial model output as it arrives instead of waiting for the full response. It improves perceived latency and lets the user stop long responses early.

### Backend Streaming Shape

The production-like shape is:

```txt
browser
-> POST /api/chat
-> backend receives prompt
-> backend streams chunks
-> browser reads response.body.getReader()
-> UI appends chunks into assistant message
```

Frontend APIs:

- `fetch("/api/chat", ...)` sends the prompt.
- `response.body.getReader()` reads streamed chunks.
- `TextDecoder` converts binary chunks into text.
- the UI appends each decoded chunk to the assistant message.
- `response.text()` is a fallback when readable streams are unavailable.

Useful AI UX metrics:

- time to first chunk/token
- total response time
- chunk count
- estimated token count

Backend APIs:

- `res.write(chunk)` sends partial output.
- `res.end()` finishes the stream.

Cancellation:

- `AbortController` cancels the browser request.
- the backend listens for the client connection closing.
- the backend stops writing chunks when the client disconnects.

Interview answer:

> In a production AI app, the browser usually should not call the model provider directly. The browser sends the prompt to our backend, the backend calls the model provider, and then the backend streams chunks back to the browser. This protects secrets and gives us a place for auth, rate limits, logging, retrieval, and validation.

Stop generating interview answer:

> Stop generating is usually implemented by cancelling the browser request with AbortController and making the backend stop the upstream model stream or local chunk loop when the client disconnects. This avoids wasting latency and compute.

Latency interview answer:

> For streaming AI UX, time to first token is often more important than total response time because it controls how quickly the user sees progress. We still track total latency and token count because they affect cost, throughput, and user experience.

## Day 1 Practice

Answer without notes:

1. What is a token?
2. What is a context window?
3. Why do LLMs hallucinate?
4. When would you use low temperature?
5. What is the difference between RAG and fine-tuning?
6. Why should the browser usually call our backend instead of the model provider directly?
