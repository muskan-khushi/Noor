from openai import OpenAI
import json
import re
import os
from config import settings

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

def load_regional_context(region_key: str) -> dict:
    path = f'data/regional_context/{region_key}.json'
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def rewrite_with_local_context(
    original_text: str,
    concept: str,
    subject: str,
    class_level: str,
    region_key: str
) -> dict:
    context = load_regional_context(region_key)
    region_name = context.get('region', region_key)
    occupations = context.get('occupations', [])[:4]
    foods = context.get('foods', [])[:4]
    festivals = context.get('festivals', [])[:3]
    geography = context.get('geography', [])[:3]

    context_summary = f"""Region: {region_name}
Local occupations: {', '.join(occupations)}
Local foods: {', '.join(foods)}
Local festivals: {', '.join(festivals)}
Local geography: {', '.join(geography)}"""

    prompt = f'''You are an expert Indian educator making textbook content relevant for local students.

The student is in Class {class_level} studying {subject} and lives in {region_name}.

ORIGINAL TEXTBOOK TEXT:
{original_text}

LOCAL CONTEXT FOR THIS STUDENT:
{context_summary}

Rewrite the above text so that all examples, names, locations, and objects are replaced with things from {region_name}.
Keep the mathematical/scientific content IDENTICAL. Only the cultural wrapping changes.

Respond in JSON with these exact keys:
- rewritten_text: The fully localised version
- changes_made: Array of specific substitutions made (e.g. "Delhi-Agra highway → Jodhpur-Jaisalmer road")
- why_this_helps: One sentence explaining why this version is easier for this student

Respond ONLY with valid JSON. No markdown.'''

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[{'role': 'user', 'content': prompt}],
        temperature=0.7,
        max_tokens=1000
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.replace('```json', '').replace('```', '').strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON object from the response using regex
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            try:
                result = json.loads(match.group())
            except json.JSONDecodeError:
                result = {
                    'rewritten_text': raw,
                    'region': region_name,
                    'why_this_helps': 'Content was rewritten with local context.'
                }
        else:
            result = {
                'rewritten_text': raw,
                'region': region_name,
                'why_this_helps': 'Content was rewritten with local context.'
            }

    result['original_text'] = original_text
    result['region'] = region_name
    return result
