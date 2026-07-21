import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"
REQUIRED_FIELDS = (
    "customer",
    "product",
    "price",
    "order_date",
    "delivery_city",
    "delivery_date",
)


def call_ollama(text: str) -> str:
    prompt = f"""
Extract information from the text below.

Return one JSON object with exactly these fields:
- customer: string or null
- product: string or null
- price: number or null
- order_date: string or null
- delivery_city: string or null
- delivery_date: string or null

Rules:
- Use only information stated in the input.
- Use null when information is missing.
- Do not guess.
- Return JSON only, without Markdown or explanation.

Input text:
{text}
""".strip()

    body = json.dumps(
        {
            "model": MODEL,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0},
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

    return result["response"]


def validate(data: object) -> dict:
    if not isinstance(data, dict):
        raise ValueError("The model did not return a JSON object.")

    missing_fields = [field for field in REQUIRED_FIELDS if field not in data]
    if missing_fields:
        raise ValueError(f"Missing fields: {', '.join(missing_fields)}")

    return {field: data[field] for field in REQUIRED_FIELDS}


def main() -> None:
    text = input("Enter an order description:\n").strip()

    if not text:
        print("Please provide an order description.")
        return

    try:
        model_output = call_ollama(text)
        extracted_data = validate(json.loads(model_output))
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        print(f"Ollama returned HTTP {error.code}: {details}")
        return
    except URLError:
        print("Could not connect to Ollama. Open the Ollama app and try again.")
        return
    except (json.JSONDecodeError, KeyError, ValueError) as error:
        print(f"The model returned invalid data: {error}")
        return

    print("\nValidated information:")
    print(json.dumps(extracted_data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
