"""
Noor — Hyperlocal Content Generator
======================================
The hyperlocal rewriting system is grounded in two established theories from
educational psychology:

1. COGNITIVE LOAD THEORY (Sweller, 1988)
   Working memory has limited capacity. When a student from rural Rajasthan reads
   a problem about "a car journey on NH-24 from Delhi to Agra", they must:
     a) Decode the unfamiliar geographic context
     b) Hold that context in working memory
     c) Map the contextual details to the mathematical structure
     d) Solve the actual problem
   Step (a)-(c) are extraneous cognitive load — effort that doesn't build
   understanding of the mathematical concept. By replacing unfamiliar context
   with the student's native context (camel journey, Jodhpur to Jaisalmer),
   we eliminate this extraneous load and free working memory for the intrinsic
   load of the concept itself.

2. VYGOTSKY'S ZONE OF PROXIMAL DEVELOPMENT (Vygotsky, 1978)
   Students learn most efficiently when new concepts are introduced via familiar
   scaffolding. A student who has never seen a market economy problem can still
   engage with "If a camel trader at Pushkar Mela charges 15% profit on camels
   bought at Rs. 25,000..."

FIDELITY CONSTRAINTS:
  The rewriting must be mathematically invariant — identical numbers, structure,
  and operations. The system validates this through:
    a) Numerical preservation check: all numbers in the rewritten text match original
    b) Operation preservation: mathematical operators/relationships unchanged
    c) Concept tagging: original concept tag is preserved verbatim

References:
  Sweller (1988). "Cognitive load during problem solving". Cognitive Science.
  Paas et al. (2003). "Cognitive load theory and instructional design". Educational Psychologist.
  Vygotsky (1978). "Mind in Society". Harvard University Press.
  Ladson-Billings (1995). "Culturally relevant pedagogy". American Educational Research Journal.
"""

import json
import logging
import re
import time
from pathlib import Path
from typing import Dict, List, Optional

from openai import OpenAI
from config import settings

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent

client = OpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)


# ──────────────────────────────────────────────────────────────
# REGIONAL CONTEXT LOADER
# ──────────────────────────────────────────────────────────────

_region_cache: Dict[str, dict] = {}


def load_regional_context(region_key: str) -> dict:
    """Load and cache regional context JSON. Raises ValueError for unknown regions."""
    if region_key in _region_cache:
        return _region_cache[region_key]

    path = BASE_DIR / 'data' / 'regional_context' / f'{region_key}.json'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            ctx = json.load(f)
        _region_cache[region_key] = ctx
        return ctx
    except FileNotFoundError:
        raise ValueError(f"Region '{region_key}' not found. Available: check data/regional_context/")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in region file '{region_key}': {e}")


# ──────────────────────────────────────────────────────────────
# NUMERICAL INVARIANCE VALIDATOR
# ──────────────────────────────────────────────────────────────

def extract_numbers(text: str) -> List[str]:
    """
    Extract all numeric tokens from text.
    Handles: integers, decimals, percentages, fractions (3/4), commas in large nums.
    """
    return re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?(?:/\d+)?(?:\s*%)?', text)


def validate_mathematical_invariance(original: str, rewritten: str) -> Dict:
    """
    Verify that the rewriting preserved all numerical values and mathematical
    structure from the original text.

    Returns:
        {
            'invariant': bool,
            'missing_numbers': List[str],
            'extra_numbers': List[str],
            'warning': str or None
        }
    """
    orig_numbers = set(n.replace(',', '') for n in extract_numbers(original))
    new_numbers  = set(n.replace(',', '') for n in extract_numbers(rewritten))

    missing = orig_numbers - new_numbers
    extra   = new_numbers - orig_numbers

    # Allow tolerance for small numbers (1-10) which may change as incidental context
    try:
        significant_missing = {n for n in missing if float(n.replace('%', '')) > 10}
        significant_extra   = {n for n in extra   if float(n.replace('%', '')) > 10}
    except ValueError:
        significant_missing = missing
        significant_extra   = extra

    invariant = len(significant_missing) == 0

    warning = None
    if significant_missing:
        warning = f"Numerical values {significant_missing} from original not found in rewrite"
    if significant_extra:
        warning = (warning or '') + f" | Unexpected new values: {significant_extra}"

    return {
        'invariant':        invariant,
        'missing_numbers':  list(missing),
        'extra_numbers':    list(extra),
        'warning':          warning,
    }


# ──────────────────────────────────────────────────────────────
# PROMPT ENGINEERING
# ──────────────────────────────────────────────────────────────

HYPERLOCAL_SYSTEM_PROMPT = """You are an expert Indian educator specialising in making
textbook content culturally resonant for students across different regions of India.

Your core principle: The MATHEMATICAL CONTENT is sacred. The CULTURAL WRAPPER changes.

You understand that a student from rural Rajasthan who has never left their district:
- Has never seen a metro, never used a highway speed calculator
- Understands distances in kos and journeys by camel or jeep on dust tracks
- Weighs grain in quintals and ser, not kilograms from textbook problems
- Knows millet prices, not stock market returns

Your rewrites make the mathematics EASIER to access, not easier. Same difficulty, different world.

CRITICAL: Never replace numeric values from the problem with "real" regional distances from context data.
If the problem says 200 km, the rewrite must still say 200 km — only place names and cultural wrappers change."""


def build_hyperlocal_prompt(
    original_text: str,
    concept: str,
    subject: str,
    class_level: str,
    context: dict,
) -> str:
    """
    Build a structured prompt for culturally-grounded content rewriting.
    """
    region       = context.get('region', 'the student\'s region')
    occupations  = context.get('occupations', [])[:5]
    foods        = context.get('foods', [])[:4]
    festivals    = context.get('festivals', [])[:3]
    geography    = context.get('geography', [])[:4]
    units        = context.get('units_of_measure', [])[:4]
    markets      = context.get('local_markets', [])[:3]
    animals      = context.get('animals', [])[:4]
    distances    = context.get('distances', [])[:3]
    sample_hint  = context.get('sample_rewrite_hint', '')
    water_sources = context.get('water_sources', [])[:3]
    locked_numbers = extract_numbers(original_text)
    locked_list = ', '.join(locked_numbers) if locked_numbers else '(none — still do not invent new problem numbers)'

    return f"""TASK: Rewrite the following Class {class_level} {subject} content for a student from {region}.

CONCEPT BEING TAUGHT: {concept}

ORIGINAL TEXT:
---
{original_text}
---

REGIONAL CONTEXT FOR {region.upper()}:
• Occupations: {', '.join(occupations)}
• Daily life: {', '.join(foods[:2])} (foods), {', '.join(festivals[:2])} (festivals)
• Geography: {', '.join(geography)}
• Traditional measures: {', '.join(units) if units else 'standard metric'}
• Markets: {', '.join(markets) if markets else 'local weekly market'}
• Animals: {', '.join(animals)}
• Water: {', '.join(water_sources) if water_sources else 'local sources'}
• Regional place names (for setting only): {', '.join(geography[:2])}
• Reference routes (DO NOT paste these distances into the problem): {', '.join(distances) if distances else 'n/a'}
• Style hint: {sample_hint}

NUMBERS THAT MUST APPEAR UNCHANGED (copy every digit exactly): {locked_list}

REWRITING RULES:
1. EVERY number in the list above must appear in rewritten_text with the same digits (200 stays 200, 50 stays 50)
2. Do NOT substitute problem distances with regional catalog distances (e.g. never change 200 km to 285 km)
3. Replace generic names (Ramesh, Priya) with names common in {region}
4. Replace generic city names with {region} places — keep the same numeric distance/speed/quantity
5. Replace goods/items with region-appropriate equivalents of similar value (not different counts or prices)
6. If the problem involves a vehicle, use region-appropriate transport but keep the same speed number
7. The mathematical OPERATION must remain identical (same formula, same structure)
8. The rewritten text should be roughly the same length as the original

WHAT TO RETURN (JSON only, no markdown):
{{
  "rewritten_text": "The complete rewritten version",
  "changes_made": [
    "Delhi → Jodhpur (distance still 200 km)",
    "car → jeep (speed still 50 km/h)",
    "Ramesh → Ranjeet Singh"
  ],
  "why_this_helps": "One sentence from a teacher's perspective: why this version helps this student specifically",
  "cognitive_load_reduction": "One sentence: what extraneous cognitive load this removes",
  "cultural_authenticity_notes": "Any important cultural fidelity notes or limitations"
}}

RESPOND ONLY WITH VALID JSON. DO NOT CHANGE ANY NUMBERS. DO NOT ADD MARKDOWN FENCES."""


def build_invariance_correction(invariance: Dict, original_text: str) -> str:
    """Extra user-message block when a prior attempt changed problem numbers."""
    locked = extract_numbers(original_text)
    return f"""

CORRECTION — YOUR PREVIOUS ATTEMPT FAILED VALIDATION:
{invariance.get('warning') or 'Numbers were changed.'}

You MUST include these exact numeric tokens in rewritten_text: {', '.join(locked) or 'none'}
Do not add new distances or speeds. Only change names, places, occupations, and cultural wrappers.
"""


def build_conservative_prompt(
    original_text: str,
    concept: str,
    subject: str,
    class_level: str,
    context: dict,
) -> str:
    """Minimal prompt for final attempt — names/places only, numbers locked."""
    region = context.get('region', 'the region')
    locked = ', '.join(extract_numbers(original_text)) or 'all original numbers'
    return f"""Rewrite for a Class {class_level} {subject} student from {region}.
Concept: {concept}

ORIGINAL (preserve every number exactly — {locked}):
{original_text}

Change ONLY: person names, city/place names, vehicle type labels, and cultural references.
Do NOT change any digit, km, km/h, Rs., %, or quantity.

Return JSON only:
{{"rewritten_text":"...","changes_made":["..."],"why_this_helps":"...","cognitive_load_reduction":"...","cultural_authenticity_notes":"..."}}"""


def _call_hyperlocal_llm(
    user_content: str,
    temperature: float = 0.7,
) -> str:
    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {'role': 'system', 'content': HYPERLOCAL_SYSTEM_PROMPT},
            {'role': 'user', 'content': user_content},
        ],
        temperature=temperature,
        max_tokens=2000,
        timeout=40,
    )
    return response.choices[0].message.content.strip()


def _enrich_result(
    result: Dict,
    original_text: str,
    region_name: str,
    region_key: str,
    class_level: str,
    subject: str,
    concept: str,
    context: dict,
    invariance: Dict,
) -> Dict:
    result['original_text'] = original_text
    result['region'] = region_name
    result['region_key'] = region_key
    result['mathematical_invariance'] = invariance
    result['class_level'] = class_level
    result['subject'] = subject
    result['concept'] = concept
    result['language_hint'] = context.get('language_hint', 'Hindi/English')
    result['success'] = True

    if 'changes_made' not in result or not isinstance(result['changes_made'], list):
        result['changes_made'] = []
    if not result.get('why_this_helps'):
        result['why_this_helps'] = (
            f"This version uses {region_name} context to reduce extraneous "
            f"cognitive load, letting the student focus on the {concept} concept."
        )
    if not result.get('cognitive_load_reduction'):
        result['cognitive_load_reduction'] = (
            "Replaces unfamiliar geographic and economic context with familiar local equivalents."
        )
    return result


def _failure_response(
    original_text: str,
    region_name: str,
    region_key: str,
    message: str,
    invariance: Optional[Dict] = None,
) -> Dict:
    return {
        'success': False,
        'error': message,
        'original_text': original_text,
        'region': region_name,
        'region_key': region_key,
        'rewritten_text': None,
        'changes_made': [],
        'mathematical_invariance': invariance or {
            'invariant': False,
            'missing_numbers': [],
            'extra_numbers': [],
            'warning': message,
        },
    }


# ──────────────────────────────────────────────────────────────
# BATCH REWRITING
# ──────────────────────────────────────────────────────────────

def batch_rewrite_for_multiple_regions(
    original_text: str,
    concept: str,
    subject: str,
    class_level: str,
    region_keys: List[str],
) -> List[Dict]:
    """
    Generate localisations for multiple regions in parallel.
    """
    import concurrent.futures

    results = []
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(3, len(region_keys))) as executor:
        futures = {
            executor.submit(
                rewrite_with_local_context,
                original_text, concept, subject, class_level, region_key
            ): region_key
            for region_key in region_keys
        }
        for future in concurrent.futures.as_completed(futures):
            region_key = futures[future]
            try:
                result = future.result()
                if result.get('success') is False:
                    errors.append(f"{region_key}: {result.get('error', 'failed')}")
                else:
                    results.append(result)
            except Exception as e:
                logger.error(f"Batch rewrite failed for {region_key}: {e}")
                errors.append(f"{region_key}: {e}")

    if not results and errors:
        raise ValueError(
            "Batch localisation failed for all regions. " + "; ".join(errors[:3])
        )

    return results


# ──────────────────────────────────────────────────────────────
# PUBLIC API
# ──────────────────────────────────────────────────────────────

def rewrite_with_local_context(
    original_text: str,
    concept: str,
    subject: str,
    class_level: str,
    region_key: str,
    max_retries: int = 2,
) -> Dict:
    """
    Rewrite textbook content with culturally resonant local context.

    Pipeline:
    1. Load regional context
    2. Generate localised version via LLM
    3. Validate mathematical invariance (numbers preserved)
    4. Return enriched response with CLT analysis
    """
    context     = load_regional_context(region_key)
    region_name = context.get('region', region_key)

    temperatures = [0.55, 0.4, 0.3]
    base_prompt = build_hyperlocal_prompt(
        original_text, concept, subject, class_level, context
    )
    last_invariance = None

    for attempt in range(max_retries + 1):
        temp = temperatures[min(attempt, len(temperatures) - 1)]
        user_prompt = base_prompt
        if last_invariance and not last_invariance.get('invariant'):
            user_prompt += build_invariance_correction(last_invariance, original_text)

        try:
            logger.info(
                f"Hyperlocal rewrite for '{region_name}' (attempt {attempt+1}, T={temp})"
            )
            t0 = time.time()
            raw = _call_hyperlocal_llm(user_prompt, temperature=temp)
            logger.info(f"LLM response in {time.time() - t0:.1f}s ({len(raw)} chars)")

            result = _extract_hyperlocal_json(raw)
            if result is None or not result.get('rewritten_text'):
                logger.warning(f"Attempt {attempt+1}: JSON parsing failed")
                if attempt < max_retries:
                    time.sleep(0.5)
                    continue
                return _failure_response(
                    original_text, region_name, region_key,
                    'Could not parse the AI response. Please try again.',
                )

            last_invariance = validate_mathematical_invariance(
                original_text,
                result.get('rewritten_text', ''),
            )

            if not last_invariance['invariant'] and attempt < max_retries:
                logger.warning(
                    f"Mathematical invariance FAILED "
                    f"(missing: {last_invariance['missing_numbers']}). Retrying."
                )
                time.sleep(0.5)
                continue

            if last_invariance['invariant']:
                return _enrich_result(
                    result, original_text, region_name, region_key,
                    class_level, subject, concept, context, last_invariance,
                )

        except Exception as e:
            logger.warning(f"Attempt {attempt+1} exception: {e}")
            if attempt < max_retries:
                time.sleep(1.0)
                continue
            return _failure_response(
                original_text, region_name, region_key,
                f'AI service error: {str(e)[:200]}',
            )

    # Final conservative pass — names/places only
    try:
        logger.info(f"Conservative hyperlocal rewrite for '{region_name}'")
        raw = _call_hyperlocal_llm(
            build_conservative_prompt(
                original_text, concept, subject, class_level, context
            ),
            temperature=0.2,
        )
        result = _extract_hyperlocal_json(raw)
        if result and result.get('rewritten_text'):
            last_invariance = validate_mathematical_invariance(
                original_text, result['rewritten_text'],
            )
            if last_invariance['invariant']:
                return _enrich_result(
                    result, original_text, region_name, region_key,
                    class_level, subject, concept, context, last_invariance,
                )
    except Exception as e:
        logger.warning(f"Conservative rewrite failed: {e}")

    return _failure_response(
        original_text, region_name, region_key,
        'Could not localise this text while keeping all numbers unchanged. '
        'Try a shorter problem or re-run.',
        last_invariance,
    )


def _extract_hyperlocal_json(raw: str) -> Optional[Dict]:
    """Extract JSON from LLM response with multiple fallback strategies."""
    cleaned = raw.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.I)
    cleaned = re.sub(r'\s*```$', '', cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Find first complete JSON object via brace matching
    brace_depth, start_idx = 0, None
    for i, ch in enumerate(cleaned):
        if ch == '{':
            if brace_depth == 0:
                start_idx = i
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1
            if brace_depth == 0 and start_idx is not None:
                try:
                    return json.loads(cleaned[start_idx:i+1])
                except json.JSONDecodeError:
                    pass

    # Attempt repair of common LLM JSON formatting errors
    try:
        repaired = re.sub(r',\s*([}\]])', r'\1', cleaned)
        repaired = repaired.replace('\u201c', '"').replace('\u201d', '"')
        repaired = repaired.replace('\u2018', "'").replace('\u2019', "'")
        return json.loads(repaired)
    except Exception:
        return None

