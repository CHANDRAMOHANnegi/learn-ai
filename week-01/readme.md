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

## Interview Answer

> In a production AI app, the browser usually calls our backend instead of the model provider directly. The backend protects API keys, handles auth, rate limits, logging, retrieval, validation, and streams chunks back to the UI.

