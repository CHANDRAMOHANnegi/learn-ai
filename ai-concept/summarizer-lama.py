import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"


def summarize(article: str) -> str:
    prompt = f"""
You summarize text for beginners.
Keep the important facts, use simple language, and do not invent information.

Summarize the following text in exactly three bullet points:

{article}
""".strip()

    body = json.dumps(
        {
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
        }
    ).encode("utf-8")

    request = Request(
        OLLAMA_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urlopen(request, timeout=120) as response:
        result = json.loads(response.read().decode("utf-8"))

    return result["response"].strip()


def main() -> None:
    article = input("Paste the text you want to summarize:\n").strip()

    if not article:
        print("Please provide some text to summarize.")
        return

    try:
        summary = summarize(article)
    except HTTPError as error:
        print(f"Ollama returned an error: HTTP {error.code}")
        return
    except URLError:
        print("Could not connect to Ollama.")
        print("Open the Ollama app, then run: ollama run llama3.2")
        return

    print("\nSummary:")
    print(summary)


if __name__ == "__main__":
    main()
