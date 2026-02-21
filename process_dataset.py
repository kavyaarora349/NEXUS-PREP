import os
import re
import json
import traceback

try:
    import pdfplumber
except ImportError:
    print("Dependencies missing! Run: pip install pdfplumber")
    exit(1)

DATA_DIR = "data"
INPUT_PDFS_DIR = "input_pdfs"

# Structural Patterns
SUBJECT_CODE_PATTERN = re.compile(r'^(.*?)\s*\[([A-Z0-9]+)\]', re.IGNORECASE)
SEMESTER_PATTERN = re.compile(r'Semester\s*:\s*(\d+)', re.IGNORECASE)
UNIT_PATTERN = re.compile(r'UNIT\s*-\s*([A-Za-z0-9]+)', re.IGNORECASE)
SET_PATTERN = re.compile(r'Set\s*([A-Z])', re.IGNORECASE)
OR_PATTERN = re.compile(r'^\s*OR\s*$', re.IGNORECASE)

# Q_START detects 1), 2) or a), b) etc.
Q_START_PATTERN = re.compile(r'^\s*(?:Q?\d+[a-z]?[\.\)]|\([a-z]\)|[a-z]\))\s+', re.IGNORECASE)
# MARKS_PATTERN detects (10), [5M], (5), at the end or anywhere
MARKS_PATTERN = re.compile(r'[\(\[]\s*(\d+)\s*(?:M|Marks?)?\s*[\)\]]', re.IGNORECASE)

def ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(INPUT_PDFS_DIR, exist_ok=True)

def extract_metadata_from_course_code(code):
    m = re.search(r'\d+', code)
    if m:
        num = m.group(0)
        if len(num) >= 4:
            return int(num[0])
        elif len(num) > 0:
            return int(num[0])
    return 0

def read_pdf_text(filepath):
    print(f"Reading PDF: {filepath}")
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text(layout=True)
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

def parse_full_dataset(text):
    """Parses a large PDF into separate chunks for each paper."""
    lines = text.split('\n')
    
    papers = []
    current_paper = None
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        if "REVA UNIVERSITY" in line.upper():
            if current_paper:
                papers.append(current_paper)
            current_paper = {
                "subject_name": "",
                "semester": 0,
                "course_code": "",
                "lines": []
            }
            continue
            
        if current_paper:
            if not current_paper["subject_name"]:
                sub_match = SUBJECT_CODE_PATTERN.search(line_clean)
                if sub_match:
                    subj = sub_match.group(1).strip()
                    code = sub_match.group(2).strip()
                    clean_subject = re.sub(r'[^a-zA-Z0-9_\s-]', '', subj).strip()
                    current_paper["subject_name"] = clean_subject
                    current_paper["course_code"] = code
                    current_paper["semester"] = extract_metadata_from_course_code(code)
            
            sem_match = SEMESTER_PATTERN.search(line_clean)
            if sem_match:
                current_paper["semester"] = int(sem_match.group(1))

            current_paper["lines"].append(line_clean)
            
        else:
            sub_match = SUBJECT_CODE_PATTERN.search(line_clean)
            if sub_match:
                subj = sub_match.group(1).strip()
                code = sub_match.group(2).strip()
                clean_subject = re.sub(r'[^a-zA-Z0-9_\s-]', '', subj).strip()
                current_paper = {
                    "subject_name": clean_subject,
                    "semester": extract_metadata_from_course_code(code),
                    "course_code": code,
                    "lines": [line_clean]
                }

    if current_paper:
        papers.append(current_paper)
        
    return papers

def extract_units_and_sets(paper_lines):
    units = {}
    
    current_unit = None
    current_set = "A" # Default to Set A when a unit starts
    
    current_question = ""
    current_marks = 0
    
    def finalize_question():
        nonlocal current_question, current_marks
        if current_question.strip() and len(current_question.strip()) > 5:
            marks_assigned = current_marks if current_marks > 0 else 5
            
            # Ensure unit exists
            unit_key = f"unit{current_unit}" if current_unit else "unit1"
            if unit_key not in units:
                units[unit_key] = {"setA": [], "setB": []}
                
            set_key = "setA" if current_set == "A" else "setB"
            units[unit_key][set_key].append({
                "text": current_question.strip(),
                "marks": marks_assigned
            })
            
        current_question = ""
        current_marks = 0

    for line in paper_lines:
        # Detect Unit change
        unit_match = UNIT_PATTERN.search(line)
        if unit_match:
            finalize_question()
            # e.g. UNIT - 1 -> unit_match.group(1) == "1"
            # Some PDFs might have "UNIT I", mapping to 1 is complex, we just use the raw match 
            # if it's alphanumeric
            val = unit_match.group(1).upper()
            if val == "I": val = "1"
            elif val == "II": val = "2"
            elif val == "III": val = "3"
            elif val == "IV": val = "4"
            elif val == "V": val = "5"
            current_unit = val
            current_set = "A" # Reset to set A for new unit
            continue
            
        # Detect Set explicit marking (Set A: or Set B:)
        set_match = SET_PATTERN.search(line)
        if set_match:
            finalize_question()
            current_set = set_match.group(1).upper()
            continue
            
        # Detect OR (which usually implies switching from Set A to Set B)
        if OR_PATTERN.match(line):
            finalize_question()
            if current_set == "A":
                current_set = "B"
            continue
            
        m_match = MARKS_PATTERN.findall(line)
        line_marks = int(m_match[-1]) if m_match else 0
        
        clean_line = MARKS_PATTERN.sub('', line).strip()

        if Q_START_PATTERN.match(line):
            finalize_question()
            current_marks = line_marks
            current_question = clean_line
        else:
            if current_question:
                if line_marks > 0 and current_marks == 0:
                    current_marks = line_marks
                current_question += " " + clean_line

    finalize_question()
    return units

def process_dataset():
    print("Starting AI Question Paper Dataset Processor (Unit Pattern Mode)...")
    ensure_dirs()
    
    pdf_files = [f for f in os.listdir(INPUT_PDFS_DIR) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print(f"Dataset missing: Could not find any PDFs inside the '{INPUT_PDFS_DIR}/' folder.")
        print("Falling back gracefully for execution. Place PDFs in input_pdfs/ and run this later.")
        return

    for pdf_file in pdf_files:
        filepath = os.path.join(INPUT_PDFS_DIR, pdf_file)
        text = read_pdf_text(filepath)
        
        if not text.strip():
            print(f"Warning: No text could be extracted from '{pdf_file}'. Skipping.")
            continue
            
        papers_raw = parse_full_dataset(text)
        print(f"Detected {len(papers_raw)} distinct question papers in '{pdf_file}'.")

        for paper in papers_raw:
            subj = paper["subject_name"]
            sem = str(paper["semester"])
            
            if not subj: continue
            
            units = extract_units_and_sets(paper["lines"])
            
            if not units:
                print(f"  Warning: No units extracted for {subj} Sem {sem}. Skipping.")
                continue
                
            print(f"  ✅ Processed [{subj} | Sem {sem}]: {len(units)} units extracted.")
            
            sem_folder = f"sem{sem}"
            save_dir = os.path.join(DATA_DIR, subj, sem_folder)
            os.makedirs(save_dir, exist_ok=True)
            
            json_payload = {
                "subject": subj,
                "semester": sem,
                "units": units
            }
            
            filename = "units.json"
            json_path = os.path.join(save_dir, filename)
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(json_payload, f, indent=2, ensure_ascii=False)
                
    print(f"\nSaved structured JSON files into '{DATA_DIR}/' subdirectories.")
    print("\n🎉 Dataset Processing Complete!")

if __name__ == "__main__":
    process_dataset()
