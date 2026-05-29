from openai import OpenAI
import json
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
    context_summary = f"""Region: {context['region']}
Local occupations: {', '.join(context['occupations'][:4])}
Local foods: {', '.join(context['foods'][:4])}
Local festivals: {', '.join(context['festivals'][:3])}
Local geography: {', '.join(context['geography'][:3])}"""

    prompt = f'''You are an expert Indian educator making textbook content relevant for local students.

The student is in Class {class_level} studying {subject} and lives in {context['region']}.

ORIGINAL TEXTBOOK TEXT:
{original_text}

LOCAL CONTEXT FOR THIS STUDENT:
{context_summary}

Rewrite the above text so that all examples, names, locations, and objects are replaced with things from {context['region']}.
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
    result = json.loads(raw)
    result['original_text'] = original_text
    result['region'] = context['region']
    return result
