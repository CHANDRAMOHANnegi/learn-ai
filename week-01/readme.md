# Week 1: LLM Fundamentals And Streaming

This week connects AI basics to a runnable frontend/backend shape.

## Build 1: Browser Mock Streaming

Path:

```txt
week-01/browser-mock-streaming/index.html
```

Open directly in a browser.

What it teaches:

- conversation state
- user message state
- assistant message state
- token-like streaming inside the browser
- stop/cancel behavior
- loading and error states

Mental flow:

```txt
submit form
-> create user message
-> create empty assistant message
-> split answer into token-like pieces
-> append one token at a time
-> re-render UI after every token
```

## Build 2: Backend Streaming

Path:

```txt
week-01/backend-streaming/
```

Run from repo root:

```bash
node week-01/backend-streaming/server.js
```

Open:

```txt
http://127.0.0.1:8787
```

What it teaches:

```txt
browser
-> POST /api/chat
-> backend receives prompt
-> backend streams chunks
-> browser reads response.body.getReader()
-> UI appends chunks into assistant message
```

Key backend idea:

```js
res.write(chunk);
```

`res.write(chunk)` sends one partial piece of the response without closing the HTTP response.

Key frontend idea:

```js
const reader = response.body.getReader();
```

`response.body.getReader()` gives the browser a stream reader so it can receive chunks as they arrive.

Fallback idea:

```js
const text = await response.text();
```

Some environments may not expose a readable response stream. In that case, show the full response with `response.text()` so the app still works, even though it loses token-by-token streaming.

UI implementation note:

Keep assistant text and metrics in separate DOM nodes:

```txt
.message
  .message-text
  .metrics
```

Do not rely on `firstChild` for updates. If the message starts empty or another child gets inserted, `firstChild` can be missing or point to the wrong node.

Useful UI metrics:

- time to first chunk
- total response time
- chunk count
- estimated token count

Why they matter:

- time to first chunk shows perceived latency
- total response time shows full completion latency
- chunk count helps debug streaming behavior
- token count is the rough unit behind context, cost, and output size

Key cancellation idea:

```js
const controller = new AbortController();
fetch("/api/chat", { signal: controller.signal });
controller.abort();
```

`AbortController` lets the frontend cancel an in-flight streaming request.

## Interview Answer

> In a production AI app, the browser usually calls our backend instead of the model provider directly. The backend protects API keys, handles auth, rate limits, logging, retrieval, validation, and streams chunks back to the UI.

Latency interview answer:

> For streaming AI UX, time to first token is often more important than total response time because it controls how quickly the user sees progress. We still track total latency and token count because they affect cost, throughput, and user experience.

## Stop Generating

Production AI UIs need a stop button because responses can be slow, expensive, or no longer useful.

Frontend:

```txt
Stop button -> AbortController.abort() -> fetch is cancelled
```

Backend:

```txt
request closes -> backend stops writing chunks
```

Interview answer:

> Stop generating is usually implemented by cancelling the browser request with AbortController and making the backend stop the upstream model stream or local chunk loop when the client disconnects. This avoids wasting latency and compute.
