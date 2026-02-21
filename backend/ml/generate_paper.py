import os
import sys
import json
import pickle
import traceback

try:
    import pdfplumber
except ImportError:
    print(json.dumps({
        "error": "Missing dependencies. Run: pip install pdfplumber google-genai"
    }))
    sys.exit(1)

MODELS_DIR = "models"
MODEL_PATH = os.path.join(MODELS_DIR, "pattern_model.pkl")

# Ensure API Key is available
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print(json.dumps({
        "error": "GEMINI_API_KEY environment variable is not set."
    }))
    sys.exit(1)


def extract_notes_text(pdf_paths):
    """Extract raw text from the student's uploaded notes."""
    text = ""
    for pdf_path in pdf_paths:
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        except Exception as e:
            print(f"[Warning] Failed to read one of the notes PDFs: {pdf_path}: {str(e)}", file=sys.stderr)
            
    if not text.strip():
         raise Exception("The provided notes PDFs contained no readable text.")
    return text


def load_pattern(subject, semester):
    """Load the REVA University mark distribution pattern for this subject/sem."""
    if not os.path.exists(MODEL_PATH):
        # Fallback to a predefined default if model is entirely missing
        return {
            "unit1": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit2": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit3": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit4": {"setA": [10, 10, 5], "setB": [10, 10, 5]}
        }
        
    try:
        with open(MODEL_PATH, 'rb') as f:
            global_patterns = pickle.load(f)
            
        key = f"{subject}_{semester}"
        if key in global_patterns and "units" in global_patterns[key]:
            return global_patterns[key]["units"]
            
        # Fallback to subject only match
        for k, v in global_patterns.items():
            if v.get("subject", "").lower() == subject.lower() and "units" in v:
                return v["units"]
                
        # Fallback to the first available pattern
        if global_patterns:
            first_key = list(global_patterns.keys())[0]
            if "units" in global_patterns[first_key]:
                return global_patterns[first_key]["units"]
                
        return {
            "unit1": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit2": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit3": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit4": {"setA": [10, 10, 5], "setB": [10, 10, 5]}
        }
        
    except Exception as e:
        print(f"[Warning] Failed to load pattern model: {e}", file=sys.stderr)
        return {
            "unit1": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit2": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit3": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
            "unit4": {"setA": [10, 10, 5], "setB": [10, 10, 5]}
        }


def build_gemini_prompt(subject, semester, pattern_units, notes_text):
    """Constructs the prompt instructing Gemini on how to format the paper."""
    
    # Analyze the loaded pattern to tell Gemini exactly what structure to use
    structure_rules = ""
    unit_count = len(pattern_units.keys()) if len(pattern_units.keys()) > 0 else 4
    
    for unit_name, sets in pattern_units.items():
        # Clean unit name from 'unit1' -> 'UNIT 1'
        display_name = unit_name.upper().replace('UNIT', 'UNIT ')
        
        set_a_marks = sets.get('setA', [10, 10, 5])
        set_b_marks = sets.get('setB', [10, 10, 5])
        
        structure_rules += f"""
- {display_name}:
  - MUST contain exactly two parallel sets (Set A OR Set B).
  - Set A must contain questions worth exactly: {', '.join([str(m) + 'M' for m in set_a_marks])}.
  - Set B must contain questions worth exactly: {', '.join([str(m) + 'M' for m in set_b_marks])}.
"""

    max_chars = 150000 
    if len(notes_text) > max_chars:
        notes_text = notes_text[:max_chars] + "\n...[Content Truncated]..."

    prompt = f"""Act as a full-stack software engineer and expert university professor. Generate a REVA University question paper for subject {subject}, semester {semester}, based on these notes and exam pattern.

CRITICAL REQUIREMENT: UNIT-WISE PARALLEL SETS
The generated question paper MUST strictly follow a unit-wise pattern, where each unit has two sets of parallel questions (an internal choice). 
You MUST NOT generate any generic "SECTION A" or "SECTION B" headers. You MUST only generate UNIT 1, UNIT 2, UNIT 3, UNIT 4, etc.
Even if the provided notes are short or missing topics for certain units, YOU MUST generate questions for ALL {unit_count} REQUIRED UNITS by extrapolating generic academic knowledge for {subject}.

REQUIRED EXAM STRUCTURE / WEIGHTAGE GUIDELINES:
{structure_rules}

Instructions for output:
1. Ensure the questions test different cognitive levels (Knowledge, Comprehension, Application, Analysis).
2. ONLY output valid JSON. No markdown backticks, no introduction.
3. You MUST use EXACTLY this JSON schema structure so the frontend can parse it. ALL required UNITS must be present.

{{
  "sections": [
    {{
      "name": "UNIT 1",
      "instructions": "Answer ONE full set (Set A OR Set B)",
      "questions": [
        {{ "text": "Set A: 1) question text goes here.", "marks": 10 }},
        {{ "text": "Set A: 2) question text goes here.", "marks": 10 }},
        {{ "text": "Set A: 3) question text goes here.", "marks": 5 }},
        {{ "text": "OR", "marks": 0 }},
        {{ "text": "Set B: 4) question text goes here.", "marks": 10 }},
        {{ "text": "Set B: 5) question text goes here.", "marks": 10 }},
        {{ "text": "Set B: 6) question text goes here.", "marks": 5 }}
      ]
    }},
    {{
      "name": "UNIT 2",
      "instructions": "Answer ONE full set (Set A OR Set B)",
      "questions": [
         // ... EXACT SAME internal choice array format for Set A and OR Set B ...
      ]
    }}
    // ... Repeat for UNIT 3 and UNIT 4
  ]
}}

Student Notes Material (Compiled from Multiple PDFs):
-------------------------
{notes_text}
-------------------------
"""
    return prompt

def generate_paper(subject, semester, notes_pdf_paths):
    """Main execution block."""
    try:
        # 1. Load the pattern map (now natively Unit > Set format)
        pattern_units = load_pattern(subject, semester)
        
        # 2. Extract text from the student's uploaded notes
        notes_text = extract_notes_text(notes_pdf_paths)
        
        # 3. Construct the prompt
        prompt = build_gemini_prompt(subject, semester, pattern_units, notes_text)
        
        # 4. Call Google Gemini using the new SDK
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        raw_json = response.text
        
        # Verify it parses correctly before printing
        parsed_json = json.loads(raw_json)
        
        max_marks = 0
        for section in parsed_json.get("sections", []):
             # To calculate Max Marks for a Unit, we only count the highest set, effectively Set A since they are parallel
             unit_marks = 0
             found_or = False
             for q in section.get("questions", []):
                  if q.get("text", "").strip().upper() == "OR":
                       break # We've hit Set B
                  unit_marks += q.get("marks", 0)
             max_marks += unit_marks

        # Inject standard required metadata for the frontend to render it beautifully
        final_paper = {
             "id": f"GEN-{subject.replace(' ', '').upper()}-{semester}",
             "university": "REVA UNIVERSITY",
             "subject": subject,
             "course": "B.Tech",
             "semester": str(semester),
             "studentName": "Student", # Will be mapped by React
             "date": "TBD",
             "timeAllowed": "3 Hours",
             "maxMarks": max_marks if max_marks > 0 else 100,
             "sections": parsed_json.get("sections", [])
        }
        
        # 5. Print to STDOUT so Node.js can read it safely
        print(json.dumps(final_paper))
        
    except Exception as e:
        # Print errors as JSON so Node.js backend can gracefully catch and surface them to React
        print(json.dumps({
            "error": str(e),
            "trace": traceback.format_exc()
        }))
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 4:
         print(json.dumps({
             "error": "Usage: python generate_paper.py \"<Subject Name>\" <Semester> \"<path/to/notes1.pdf>\" [path2...]"
         }))
         sys.exit(1)
         
    subject_arg = sys.argv[1]
    semester_arg = sys.argv[2]
    notes_pdf_args = sys.argv[3:]
    
    generate_paper(subject_arg, semester_arg, notes_pdf_args)
