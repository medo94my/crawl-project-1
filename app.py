from typing import Optional, Union, Dict, List, Any
import json
import re
import asyncio
import os
import random
from functools import wraps
from flask import Flask, request, render_template, jsonify, make_response, url_for
from dotenv import load_dotenv
from crawler import crawler
from utils.groq_con import analyze_seo_with_llm
from utils.googleai import google_ai
import traceback
# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "default_secret_key")

# Configure debug mode
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

def async_route(f):
    """Decorator to handle async routes in Flask."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))
    return wrapper

def log_debug(message: str) -> None:
    """Helper function for debug logging."""
    if DEBUG:
        print(f"\n--- {message} ---")

def parse_json(data: str) -> Optional[Union[Dict, List]]:
    """
    Parse JSON string into Python object with debug logging.

    Args:
        data (str): JSON string to parse

    Returns:
        Optional[Union[Dict, List]]: Parsed JSON object or None if parsing fails
    """
    try:
        parsed_json = json.loads(data)
        log_debug("Parsed JSON")
        if DEBUG:
            print(json.dumps(parsed_json, indent=2))
        return parsed_json
    except json.JSONDecodeError as e:
        log_debug(f"Failed to parse JSON: {e}")
        return None

def extract_and_parse_json(input_string: Optional[str]) -> Optional[Union[Dict, List]]:
    """
    Extracts and parses JSON from a string, handling Markdown code fences.

    Args:
        input_string (Optional[str]): String potentially containing JSON data

    Returns:
        Optional[Union[Dict, List]]: Parsed JSON object or None if parsing fails
    """
    if not isinstance(input_string, str) or not input_string.strip():
        return None

    # Pattern to match JSON content within Markdown code fences
    pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(pattern, input_string, re.MULTILINE)

    json_string = match.group(1).strip() if match else input_string.strip()

    if not json_string:
        return None

    try:
        random_string = random.randint(1, 100)
        json_data = json.loads(json_string)
        with open(f'data-{random_string}.json', 'w') as f:
            json.dump(json_data, f)
        return json_data
    except json.JSONDecodeError:
        return None

@app.route('/', methods=['GET'])
@async_route
async def index() -> str:
    """
    Main route handler for the SEO analysis tool.

    Returns:
        str: Rendered template with analysis results
    """
    data = None
    google_ai_response = None
    return render_template(
        'index.html',
        data=data,
        google_ai_response=google_ai_response
    )

@app.route('/', methods=['POST'])
@async_route
async def analyze_url(): # Type hint 'str' is likely incorrect, should probably be Response or Tuple
    """
    Analyze a URL using the crawler and Google AI.

    Returns:
        Response: JSON response object.
    """
    # 1. Check Content-Type and Get JSON Data
    if not request.is_json:
        log_debug("Error: Request content type is not application/json")
        # 415 Unsupported Media Type is more appropriate than 400 here
        return jsonify({"message": "Request must be JSON", "success": False}), 415

    try:
        req_data = request.get_json()
        if req_data is None:
             raise ValueError("No JSON data received in request body")
        url_to_analyze = req_data.get('url') # Extract 'url' field from JSON
    except Exception as e:
        log_debug(f"Error parsing request JSON or getting 'url' key: {e}")
        return jsonify({"message": f"Invalid JSON format or missing 'url' key: {e}", "success": False}), 400

    # 2. Validate the URL
    if not url_to_analyze or not isinstance(url_to_analyze, str) or url_to_analyze.strip() == "":
        log_debug(f"Validation Error: URL is required. Received: '{url_to_analyze}'")
        # Use jsonify for consistent JSON errors
        return jsonify({
            "message": "URL is required and must be a non-empty string",
            "success": False
        }), 400 # 400 Bad Request is appropriate

    try:
        log_debug(f"Analyzing URL: {url_to_analyze}")
        # 3. Fetch and analyze data
        # Renamed 'data' to avoid conflict with 'req_data' from request json
        crawled_data_result = await crawler(url_to_analyze)
        if isinstance(crawled_data_result, str) and "json" in crawled_data_result.lower(): # Use lower() for case-insensitivity
            log_debug("Parsing crawler result")
            crawled_data_result = extract_and_parse_json(crawled_data_result)
            # Optional: Handle if parsing returns None
            if crawled_data_result is None:
                 log_debug("Failed to parse JSON from crawler result string.")
                 # Decide how to proceed - return error or use raw string?
                 # Example: return error
                 raise ValueError("Crawler returned invalid JSON format")


        log_debug("Calling Google AI")
        google_ai_result = await google_ai(crawled_data_result) # Pass potentially parsed data
        if isinstance(google_ai_result, str) and "json" in google_ai_result.lower():
             log_debug("Parsing Google AI result")
             google_ai_result = extract_and_parse_json(google_ai_result)
             # Optional: Handle if parsing returns None
             if google_ai_result is None:
                  log_debug("Failed to parse JSON from Google AI result string.")
                  raise ValueError("Google AI returned invalid JSON format")


        log_debug("Analysis successful")
        # 4. Return success response using jsonify
        return jsonify({
            "message": "Analysis successful",
            "success": True,
            "data": crawled_data_result,
            "ai_analysis": google_ai_result
        }), 200

    except Exception as e:
        # 5. Return JSON error response, NOT HTML
        tb_str = traceback.format_exc() # Get detailed traceback
        log_debug(f"Error processing analysis for {url_to_analyze}: {e}\n{tb_str}")
        # Use jsonify and 500 Internal Server Error status code
        return jsonify({
            "message": f"An internal error occurred during analysis: {str(e)}",
            "success": False
        }), 500

@app.errorhandler(404)
def not_found_error(error) -> str:
    """Handle 404 errors."""
    return render_template('404.html', error=str(error) ), 404

@app.errorhandler(500)
def internal_error(error) -> str:
    """Handle 500 errors."""
    return render_template('500.html', error=str(error)), 500

if __name__ == '__main__':
    app.run(
        debug=DEBUG,
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 8000))
    )
