from bs4 import BeautifulSoup

def extract_text_from_html(html_content):
    """
    Extracts plain text from HTML content, removing all tags and scripts.

    Args:
        html_content (str): The HTML content as a string.

    Returns:
        str: The extracted plain text.
    """
    try:
        soup = BeautifulSoup(html_content, "html.parser")

        # Remove script and style tags
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        # Get the text and join it, stripping extra whitespace
        text = " ".join(soup.stripped_strings)
        return text

    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""  # Return an empty string in case of an error
