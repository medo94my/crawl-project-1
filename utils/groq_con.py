from typing import Dict, List, Optional, Union, Any
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import groq
import os
import json
import re
import asyncio
from pydantic import BaseModel, Field, ValidationError
from requests.exceptions import RequestException
from functools import lru_cache

# Environment variable for API key
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")

# Initialize Groq client with error handling
try:
    groq_client = groq.Groq(api_key=GROQ_API_KEY)
except Exception as e:
    raise RuntimeError(f"Failed to initialize Groq client: {e}")

# Pydantic Models for JSON Validation
class SuggestionItem(BaseModel):
    Suggestion: Optional[str] = Field(default=None, description="SEO suggestion")
    Title: Optional[str] = Field(default=None, description="Alternative title")
    Meta_Description: Optional[str] = Field(default=None, description="Alternative meta description")
    H1_Tag: Optional[str] = Field(default=None, description="Alternative H1 tag")
    Keyword: Optional[str] = Field(default=None, description="Suggested keyword")
    Reason: Optional[str] = Field(default=None, description="Reason for suggestion")
    Insertion: Optional[str] = Field(default=None, description="Where to insert the keyword")
    Frequency: Optional[int] = Field(default=None, description="Suggested keyword frequency")

class AnalysisSuggestions(BaseModel):
    Analysis: Optional[str] = Field(default=None, description="Analysis of the SEO element")
    Suggestions: List[SuggestionItem] = Field(default_factory=list, description="List of suggestions")

class SEOAnalysis(BaseModel):
    Title_Analysis_and_Suggestions: AnalysisSuggestions
    Meta_Description_Analysis_and_Suggestions: AnalysisSuggestions
    H1_Tag_Analysis_and_Suggestions: AnalysisSuggestions
    Content_Analysis_and_Suggestions: AnalysisSuggestions
    Link_Analysis_and_Suggestions: AnalysisSuggestions
    Overall_SEO_Assessment: Optional[str] = Field(default=None, description="Overall SEO assessment")
    Keyword_Optimization_Suggestions: List[SuggestionItem] = Field(default_factory=list, description="Keyword optimization suggestions")
    Schema_Markup_Suggestion: Optional[str] = Field(default=None, description="Schema markup suggestion")
    Mobile_Optimization_Suggestion: Optional[str] = Field(default=None, description="Mobile optimization suggestion")
    Page_Speed_Suggestion: Optional[str] = Field(default=None, description="Page speed optimization suggestion")

class SEOAnalysisResponse(BaseModel):
    SEO_Analysis_and_Enhancement_Suggestions: SEOAnalysis

@lru_cache(maxsize=100)
async def check_seo(url: str) -> Dict[str, Any]:
    """
    Checks SEO elements of a given URL with caching.

    Args:
        url (str): The URL to analyze

    Returns:
        Dict[str, Any]: SEO data or error information
    """
    try:
        # Add timeout and headers for better reliability
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzer/1.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }

        async with requests.Session() as session:
            response = await session.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Extract SEO elements more efficiently
            title = soup.title.string if soup.title else "No Title"
            meta_description = soup.find("meta", attrs={"name": "description"})
            meta_description_content = meta_description["content"] if meta_description else "No Description"

            # Use list comprehension for better performance
            h1_tags = [h1.text.strip() for h1 in soup.find_all("h1")]
            links = [urljoin(url, link.get("href")) for link in soup.find_all("a") if link.get("href")]

            # Optimize link processing
            parsed_url = urlparse(url)
            internal_links = [link for link in links if urlparse(link).netloc == parsed_url.netloc]
            external_links = [link for link in links if urlparse(link).netloc != parsed_url.netloc]

            # Optimize text content extraction
            text_content = " ".join(soup.stripped_strings)

            return {
                "url": url,
                "title": title,
                "meta_description": meta_description_content,
                "h1_tags": h1_tags,
                "internal_links": len(internal_links),
                "external_links": len(external_links),
                "text_length": len(text_content),
            }

    except RequestException as e:
        return {"url": url, "error": f"Request error: {str(e)}"}
    except Exception as e:
        return {"url": url, "error": f"Unexpected error: {str(e)}"}

def fix_json(json_string: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to fix common JSON formatting issues.

    Args:
        json_string (str): The JSON string to fix

    Returns:
        Optional[Dict[str, Any]]: Fixed JSON data or None if unfixable
    """
    try:
        return json.loads(json_string)
    except json.JSONDecodeError:
        # Common fixes for JSON issues
        json_string = re.sub(r'([^\\])\\([^"\\])', r'\1\\\\\2', json_string)  # Fix escaped characters
        json_string = re.sub(r'([^\\])"([^"]*?)([^\\])"', r'\1"\2\3"', json_string)  # Fix unescaped quotes
        try:
            return json.loads(json_string)
        except json.JSONDecodeError:
            return None

async def analyze_seo_with_llm(seo_data: Dict[str, Any]) -> Union[Dict[str, Any], str]:
    """
    Analyzes SEO data using an LLM with improved error handling and validation.

    Args:
        seo_data (Dict[str, Any]): SEO data to analyze

    Returns:
        Union[Dict[str, Any], str]: Analysis results or error message
    """
    if "error" in seo_data:
        return f"Error analyzing SEO: {seo_data['error']}"

    prompt = f"""
Role: Expert SEO Content Analyst
Task: Analyze SEO data and provide actionable improvements in VALID JSON.
Data: {json.dumps(seo_data, ensure_ascii=False)}
Schema: Strictly adhere to {SEOAnalysisResponse.schema_json()}

Required Content within Schema:
- Min. 3 suggestions/section.
- Keyword details (location, frequency).
- Schema type.
- Mobile/Pagespeed suggestions.

Strict JSON Formatting:
- Double quotes only.
- JSON object ONLY (no extra text).
- Use "N/A" instead of empty strings.
- No internal newlines in strings.
"""

    try:
        response = await groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides SEO analysis in JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,  # Lower temperature for more consistent output
            max_tokens=2048,  # Increased token limit for comprehensive analysis
        )

        raw_json = response.choices[0].message.content
        parsed_json = fix_json(raw_json)

        if not parsed_json:
            return "Error: Failed to parse LLM response as JSON"

        try:
            validated_data = SEOAnalysisResponse.parse_obj(parsed_json)
            return validated_data.dict()
        except ValidationError as e:
            return f"Validation error: {str(e)}"

    except groq.BadRequestError as e:
        return f"LLM API error: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
