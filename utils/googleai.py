from google import genai
import os
import json
from utils.groq_con import SEOAnalysisResponse
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY)
async def google_ai(seo_data):
    prompt = f"""Role: Expert SEO Content AnalystTask: Analyze SEO data and provide actionable improvements in VALID JSON.Data: {json.dumps(seo_data)}Schema: Strictly adhere to {SEOAnalysisResponse.schema_json()}Required Content within Schema:- Min. 3 suggestions/section.- Keyword details (location, frequency).- Schema type.- Mobile/Pagespeed suggestions.Sßtrict JSON Formatting:- Double quotes only.- JSON object ONLY (no extra text).- Use "N/A" instead of empty strings.- No internal newlines in strings.Return the output strictly as a raw JSON object.Do NOT wrap the JSON in Markdown code blocks (```json ... ```) or any other formatting.Output ONLY the JSON text itself, """
    response = client.models.generate_content(
        model="gemini-2.0-flash", contents=prompt
    )
    # print(response)
    return response.text
