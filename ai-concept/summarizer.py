from openai import OpenAI


def main() -> None:
    client = OpenAI()
    article = input("Paste the text you want to summarize:\n").strip()

    if not article:
        print("Please provide some text to summarize.")
        return

    response = client.responses.create(
        model="gpt-5.6-sol",
        instructions=(
            "You summarize text for beginners. Keep the important facts, "
            "use simple language, and do not add unsupported information."
        ),
        input=(
            "Summarize the following text in three bullet points:\n\n"
            f"{article}"
        ),
    )

    print("\nSummary:")
    print(response.output_text)


if __name__ == "__main__":
    main()
