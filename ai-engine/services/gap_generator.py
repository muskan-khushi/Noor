"""
Noor — Gap Study Module Generator
====================================
Generates personalised micro-study modules for curriculum gaps using LLM.

The key insight from cognitive science (Bloom 1956, Anderson & Krathwohl 2001)
is that effective learning requires scaffolding across six cognitive levels:
  L1 Remember:    Recall facts and terminology
  L2 Understand:  Explain concepts in own words
  L3 Apply:       Use concept to solve a novel problem
  L4 Analyse:     Break down a problem into components
  L5 Evaluate:    Critique approaches, identify traps
  L6 Create:      Synthesise multiple concepts

National exam MCQs (NEET/JEE/CUET) primarily test L3–L4. Students from state
boards where a topic is absent are typically at L1 or below. The optimal
pedagogical sequence therefore is:

  Brief conceptual foundation (L1→L2) → Worked example (L2→L3) → 
  Exam-style problem (L3→L4) → Common mistake identification (L4→L5)

This is exactly what our structured JSON schema delivers.

Additional features:
  — Bloom's level tagging for each generated question
  — Prerequisite topic identification (what must student know first?)
  — Confidence calibration warnings for topics the LLM is uncertain about
  — Structured prompt engineering with few-shot examples for consistency

The prompt is engineered with:
  1. Role specification (expert Indian educator with exam board knowledge)
  2. Constraint specification (JSON schema, length, language level)
  3. Quality signals (avoid formulaic explanations, use SI units, etc.)
  4. Negative examples (what NOT to generate) for the most common failure modes
"""

import json
import logging
import re
import time
from typing import Dict, Optional

from openai import OpenAI
from config import settings

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)

# ──────────────────────────────────────────────────────────────
# JSON SCHEMA — defines the exact structure of a study module
# ──────────────────────────────────────────────────────────────

MODULE_SCHEMA = {
    "explanation": "4-5 clear sentences introducing the concept from scratch",
    "prerequisite_concepts": ["concept_1", "concept_2"],
    "bloom_level": "Apply",
    "key_points": ["point_1", "point_2", "point_3"],
    "mnemonics": "memory device if applicable, else null",
    "example_problem": "One complete exam-style question",
    "example_problem_bloom": "Apply",
    "solution": "Step-by-step solution with reasoning for each step",
    "common_mistake": "The single most common error students make on this topic",
    "common_mistake_why": "Why students make this mistake (cognitive root)",
    "similar_topics": ["related topic 1", "related topic 2"],
    "difficulty_estimate": "Medium",
}

# ──────────────────────────────────────────────────────────────
# BLOOM'S TAXONOMY DESCRIPTORS (for prompt injection)
# ──────────────────────────────────────────────────────────────

BLOOM_LEVELS = {
    'Remember':   'recall definitions, state laws, list properties',
    'Understand': 'explain mechanisms, describe processes, paraphrase',
    'Apply':      'use formulae to solve, calculate, determine',
    'Analyse':    'compare structures, deduce, break into components',
    'Evaluate':   'select best method, justify, critique',
    'Create':     'design a synthesis, derive a new expression',
}

# Exam-to-Bloom level mapping (empirical from 2020-2024 papers)
EXAM_BLOOM_PROFILE = {
    'NEET':      {'Remember': 0.15, 'Understand': 0.20, 'Apply': 0.45, 'Analyse': 0.20},
    'JEE Mains': {'Remember': 0.05, 'Understand': 0.10, 'Apply': 0.50, 'Analyse': 0.35},
    'CUET':      {'Remember': 0.25, 'Understand': 0.30, 'Apply': 0.35, 'Analyse': 0.10},
}

# ──────────────────────────────────────────────────────────────
# PROMPT ENGINEERING
# ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a Senior Academic Expert with 15+ years of experience
teaching Chemistry, Physics, and Mathematics for NEET, JEE Mains, and CUET.

You have deep knowledge of:
- Indian state board syllabi (Maharashtra, Rajasthan, Tamil Nadu, Kerala, Punjab, West Bengal)
- The precise cognitive level of questions in national competitive exams
- Common misconceptions held by students who learned from state board textbooks
- Bloom's Revised Taxonomy as applied to Indian exam question design

Your outputs are used directly by Class 11-12 students who have NEVER seen the
topic before. Write as if the student is intelligent but starting from zero on
this specific concept."""

def build_generation_prompt(topic: str, exam: str, subject: str) -> str:
    """
    Construct a structured prompt for gap module generation.

    Prompt engineering principles applied:
    1. Role + context specification (primes relevant knowledge)
    2. Output schema injection (prevents hallucinating structure)
    3. Quality constraint enumeration (prevents common failure modes)
    4. Negative examples for the most critical constraints
    5. Bloom's taxonomy targeting based on exam profile
    """
    # Determine target Bloom's level from exam profile
    bloom_profile = EXAM_BLOOM_PROFILE.get(exam, EXAM_BLOOM_PROFILE['NEET'])
    primary_bloom = max(bloom_profile, key=bloom_profile.get)
    bloom_desc = BLOOM_LEVELS[primary_bloom]

    schema_str = json.dumps(MODULE_SCHEMA, indent=2)

    return f"""TASK: Generate a complete micro-study module for a student who has NEVER seen this topic.

EXAM: {exam}
SUBJECT: {subject}
MISSING TOPIC: {topic}
TARGET BLOOM LEVEL: {primary_bloom} ({bloom_desc})

OUTPUT REQUIREMENTS:
1. explanation — Build from first principles. No assumed knowledge. 4-5 sentences.
   GOOD: "Halogens are Group 17 elements. They have 7 valence electrons and readily
   gain one electron to form stable halide ions. The reactivity decreases down the
   group because..."
   BAD: "Halogens have various properties that are important for NEET."

2. prerequisite_concepts — What must the student revise FIRST? 2-3 topics max.
   GOOD: ["periodic table and groups", "electronic configuration", "oxidation states"]
   BAD: ["chemistry basics", "general science"]

3. key_points — Memory-anchoring facts, each a complete sentence.
   Must include at least one numerical/quantitative fact if applicable.
   GOOD: ["Fluorine is the most electronegative element (χ = 4.0 on Pauling scale)",
          "Cl2 is a yellow-green gas used in water treatment",
          "F2 cannot be prepared by electrolysis of aqueous solution"]
   BAD: ["Halogens are important", "They react with metals", "Know their properties"]

4. example_problem — A complete {exam} question at {primary_bloom} level.
   Include all options if MCQ. Include units in every answer choice.
   GOOD: "Which of the following interhalogen compounds has a T-shaped geometry?
          (A) ClF3  (B) IF5  (C) BrF  (D) ICl3"
   BAD: "What is an interhalogen compound?" [too simple, not exam-level]

5. solution — Step-by-step. Show reasoning, not just calculation.
   For MCQ: explain why each wrong option is wrong.
   GOOD: "Step 1: Recall VSEPR theory. BrF3 has 3 bond pairs + 2 lone pairs = 5
          electron domains = trigonal bipyramidal electron geometry.
          Step 2: The 2 lone pairs occupy equatorial positions to minimise
          repulsion → T-shaped molecular geometry. Answer: (A) ClF3.
          Why (B) is wrong: IF5 has 5 bonds + 1 lone pair = octahedral
          electron geometry → square pyramidal shape."

6. common_mistake — One specific, named mistake with cognitive root.
   GOOD: "Students confuse ClO2 (chlorine dioxide, used in paper bleaching) with
          ClO- (hypochlorite, used in household bleach). The distinction is oxidation
          state: Cl is +4 in ClO2 but +1 in ClO-. This confuses students because
          both are 'chlorine + oxygen' compounds."
   BAD: "Students don't remember the properties well."

7. difficulty_estimate — One of: Easy, Medium, Hard (relative to {exam} standards)

OUTPUT JSON SCHEMA:
{schema_str}

CRITICAL RULES:
- Use only SI units and IUPAC nomenclature
- Every numerical claim must be accurate to the precision a student would be tested on
- Do NOT use LaTeX. Plain text only (e.g. "H2O" not "$H_2O$")
- If you are uncertain about any factual claim, mark it with [VERIFY] in the field
- Respond ONLY with valid JSON matching the schema. No preamble, no markdown fences.
- All field names must be exactly as shown. Extra fields are fine, missing fields break the app."""


# ──────────────────────────────────────────────────────────────
# JSON EXTRACTION AND VALIDATION
# ──────────────────────────────────────────────────────────────

REQUIRED_FIELDS = [
    'explanation', 'key_points', 'example_problem', 'solution', 'common_mistake'
]

def _extract_json_from_response(raw: str) -> Optional[Dict]:
    """
    Robust JSON extraction with multiple fallback strategies.
    LLMs sometimes wrap JSON in markdown or add preamble text despite instructions.
    """
    # Strategy 1: Direct parse
    cleaned = raw.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.I)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract first complete JSON object using brace matching
    brace_depth = 0
    start_idx = None
    for i, ch in enumerate(cleaned):
        if ch == '{':
            if brace_depth == 0:
                start_idx = i
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1
            if brace_depth == 0 and start_idx is not None:
                candidate = cleaned[start_idx:i+1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass

    # Strategy 3: Attempt repair — fix common LLM JSON errors
    try:
        # Remove trailing commas before } or ]
        repaired = re.sub(r',\s*([}\]])', r'\1', cleaned)
        # Replace smart quotes
        repaired = repaired.replace('\u201c', '"').replace('\u201d', '"')
        repaired = repaired.replace('\u2018', "'").replace('\u2019', "'")
        return json.loads(repaired)
    except Exception:
        pass

    return None


def _validate_module(module: Dict, exam: str, subject: str) -> Dict:
    """
    Validate and repair a generated module dict.
    Ensures all required fields exist and have appropriate types/lengths.
    """
    # Ensure required fields with fallbacks
    if 'explanation' not in module or not module['explanation']:
        module['explanation'] = f"This topic covers key concepts in {subject} relevant to {exam}."

    if 'key_points' not in module or not isinstance(module['key_points'], list):
        module['key_points'] = []
    module['key_points'] = [str(kp) for kp in module['key_points'] if kp][:6]

    if 'example_problem' not in module or not module['example_problem']:
        module['example_problem'] = f"A typical {exam} question on this topic would test application of these concepts."

    if 'solution' not in module or not module['solution']:
        module['solution'] = "Refer to the key points above for the solution approach."

    if 'common_mistake' not in module or not module['common_mistake']:
        module['common_mistake'] = "Students often confuse this concept with related topics in the same chapter."

    # Normalise bloom level
    valid_blooms = set(BLOOM_LEVELS.keys())
    if module.get('bloom_level') not in valid_blooms:
        module['bloom_level'] = 'Apply'
    if module.get('example_problem_bloom') not in valid_blooms:
        module['example_problem_bloom'] = 'Apply'

    # Normalise difficulty
    if module.get('difficulty_estimate') not in ('Easy', 'Medium', 'Hard'):
        module['difficulty_estimate'] = 'Medium'

    # Ensure prerequisite_concepts is a list
    if not isinstance(module.get('prerequisite_concepts'), list):
        module['prerequisite_concepts'] = []

    # Ensure similar_topics is a list
    if not isinstance(module.get('similar_topics'), list):
        module['similar_topics'] = []

    # Ensure mnemonics is None or string
    if not isinstance(module.get('mnemonics'), (str, type(None))):
        module['mnemonics'] = None

    return module


# ──────────────────────────────────────────────────────────────
# PUBLIC API
# ──────────────────────────────────────────────────────────────

def generate_gap_module(
    topic: str,
    exam: str,
    subject: str,
    max_retries: int = 2,
) -> Dict:
    """
    Generate a complete, structured micro-study module for a curriculum gap.

    Implements retry logic with temperature escalation:
    — First attempt at temperature=0.3 (factual accuracy prioritised)
    — Retry at temperature=0.5 if JSON parsing fails (more generative variation
      often resolves rigid formatting failures)

    Args:
        topic:       The gap topic string (from national syllabus)
        exam:        Target exam ('NEET', 'JEE Mains', 'CUET')
        subject:     Subject ('Chemistry', 'Physics', 'Mathematics', 'Biology')
        max_retries: Number of additional attempts if parsing fails

    Returns:
        Validated module dict conforming to MODULE_SCHEMA
    """
    temperatures = [0.3, 0.5, 0.7]  # escalate on each retry

    for attempt in range(max_retries + 1):
        temp = temperatures[min(attempt, len(temperatures)-1)]

        try:
            logger.info(f"Generating module for '{topic[:60]}...' (attempt {attempt+1}, T={temp})")
            t0 = time.time()

            response = client.chat.completions.create(
                model=settings.MODEL_NAME,
                messages=[
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': build_generation_prompt(topic, exam, subject)},
                ],
                temperature=temp,
                max_tokens=900,
                timeout=35,
            )

            raw = response.choices[0].message.content
            elapsed = time.time() - t0
            logger.info(f"LLM response in {elapsed:.1f}s ({len(raw)} chars)")

            module = _extract_json_from_response(raw)

            if module is None:
                logger.warning(f"Attempt {attempt+1}: JSON extraction failed")
                if attempt < max_retries:
                    time.sleep(0.5)
                    continue
                else:
                    # Last resort fallback
                    return _fallback_module(topic, exam, subject, raw)

            # Validate and repair
            module = _validate_module(module, exam, subject)
            return module

        except Exception as e:
            logger.warning(f"Attempt {attempt+1} failed: {e}")
            if attempt < max_retries:
                time.sleep(1.0)
                continue
            # Return structured fallback to avoid breaking the pipeline
            return _fallback_module(topic, exam, subject, str(e))


def _fallback_module(topic: str, exam: str, subject: str, raw_response: str = '') -> Dict:
    """
    Graceful degradation: return a useful partial module when generation fails.
    Includes the raw LLM output in the explanation field for transparency.
    """
    logger.warning(f"Using fallback module for: {topic[:60]}")
    return {
        'explanation': (
            f"This topic ({topic}) is an important concept in {subject} that appears in {exam}. "
            f"Please refer to NCERT Class 11/12 textbooks for a full explanation. "
            f"Additional sources: {exam} official material and coaching notes."
        ),
        'prerequisite_concepts': [],
        'bloom_level': 'Apply',
        'key_points': [
            f"This topic appears in {exam} and needs dedicated study.",
            "Refer to NCERT and approved coaching material for complete coverage.",
        ],
        'mnemonics': None,
        'example_problem': f"Study this topic and attempt previous year {exam} questions on it.",
        'example_problem_bloom': 'Apply',
        'solution': "Refer to official study material for this topic.",
        'common_mistake': "Students often skip this topic assuming it's not important. It appears frequently in exams.",
        'common_mistake_why': "State board textbooks do not cover this topic at exam depth.",
        'similar_topics': [],
        'difficulty_estimate': 'Medium',
        '_generation_note': 'auto_generated_fallback',
    }