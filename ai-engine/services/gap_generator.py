# Uses Groq (free) via OpenAI-compatible client
from openai import OpenAI
import json
import re
from config import settings

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

def generate_gap_module(topic: str, exam: str, subject: str) -> dict:
    prompt = f'''You are an expert Indian educator preparing a Class 11-12 student for {exam} in {subject}.

The student's state board textbook never covered this topic:
TOPIC: {topic}

Generate a concise study module in JSON format with EXACTLY these keys:
- explanation: A clear 4-5 sentence explanation of this topic from scratch
- key_points: Array of 3-5 bullet points the student must remember
- example_problem: One typical {exam}-style question on this topic
- solution: Step-by-step solution to the example problem
- common_mistake: One common mistake students make on this topic

Respond ONLY with valid JSON. No preamble. No markdown fences.'''

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[{'role': 'user', 'content': prompt}],
        temperature=0.3,
        max_tokens=800,
        timeout=30  # 30 second timeout for resilience
    )
    raw = response.choices[0].message.content.strip()
    raw = raw.replace('```json', '').replace('```', '').strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON object from the response using regex
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        # Complete fallback
        return {
            'explanation': raw,
            'example_problem': '',
            'solution': '',
            'common_mistake': ''
        }
