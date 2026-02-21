import os
import json
import pickle
from collections import defaultdict

DATA_DIR = "data"
MODELS_DIR = "models"

os.makedirs(MODELS_DIR, exist_ok=True)

def generate_training_data():
    """Reads units.json from data/ folder and configures Unit/Set marks distribution patterns."""
    if not os.path.exists(DATA_DIR):
        print(f"Creating empty '{DATA_DIR}' directory. Please populate it with process_dataset.py outputs.")
        os.makedirs(DATA_DIR, exist_ok=True)
        return []

    distribution_pattern = {}

    for subject in os.listdir(DATA_DIR):
        subject_path = os.path.join(DATA_DIR, subject)
        if not os.path.isdir(subject_path): continue
        
        for sem_folder in os.listdir(subject_path):
            sem_path = os.path.join(subject_path, sem_folder)
            if not os.path.isdir(sem_path): continue
            
            # The JSON file created by process_dataset.py
            json_path = os.path.join(sem_path, "units.json")
            if not os.path.exists(json_path):
                 # Fallback to any questions_*.json if the name varies slightly
                 for f in os.listdir(sem_path):
                     if f.endswith('.json'):
                         json_path = os.path.join(sem_path, f)
                         break

            if not os.path.exists(json_path):
                continue
                
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                print(f"Error reading {json_path}: {e}")
                continue

            subj = data.get("subject", subject)
            sem = data.get("semester", sem_folder.replace('sem', ''))
            units_data = data.get("units", {})

            key = f"{subj}_{sem}"
            
            # If creating for the first time
            if key not in distribution_pattern:
                distribution_pattern[key] = {
                    "subject": subj,
                    "semester": sem,
                    "units": {}
                }
            
            # Merge logic for patterns: we want to find the most common pattern of marks
            # e.g. for Unit 1, Set A might be [10, 10, 5]. We just take the latest dataset example for now
            # as a rule-based representative pattern.

            for unit_name, sets in units_data.items():
                 # unit_name is e.g. "unit1"
                 if unit_name not in distribution_pattern[key]["units"]:
                     distribution_pattern[key]["units"][unit_name] = {}
                     
                 for set_name, questions in sets.items():
                     # extract the marks array for this set
                     marks_array = [q.get("marks", 5) for q in questions if q.get("marks", 5) > 0]
                     
                     # Only keep the pattern if it has questions
                     if len(marks_array) > 0:
                          distribution_pattern[key]["units"][unit_name][set_name] = marks_array

    # Formatting and cleanup
    final_patterns = []
    for k, v in distribution_pattern.items():
        # Ensure we have a default pattern if none parsed properly, fallback to REVA standard 10, 10, 5
        if not v["units"]:
            v["units"] = {
                 "unit1": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
                 "unit2": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
                 "unit3": {"setA": [10, 10, 5], "setB": [10, 10, 5]},
                 "unit4": {"setA": [10, 10, 5], "setB": [10, 10, 5]}
            }
        
        # Ensure every unit has Set A and Set B, duplicate if one is missing to ensure parallel choices
        for unit_name in v["units"]:
             if "setA" not in v["units"][unit_name] and "setB" in v["units"][unit_name]:
                 v["units"][unit_name]["setA"] = list(v["units"][unit_name]["setB"])
             elif "setB" not in v["units"][unit_name] and "setA" in v["units"][unit_name]:
                 v["units"][unit_name]["setB"] = list(v["units"][unit_name]["setA"])
                 
             # Fallback array if completely missing marks
             if "setA" not in v["units"][unit_name]:
                  v["units"][unit_name]["setA"] = [10, 10, 5]
                  v["units"][unit_name]["setB"] = [10, 10, 5]

        final_patterns.append(v)
        
    return final_patterns

def build_pipeline():
    print("==================================================")
    print("      AI Question Paper Generator ML Pipeline     ")
    print("              (Strict Unit/Set Mode)              ")
    print("==================================================")
    
    print("\n[1/2] Loading Structure from Parsed Datasets...")
    patterns_list = generate_training_data()
    
    if not patterns_list:
        print("⚠️ No units.json found in data/. The model will be empty.")
        print("You must place some PDFs in input_pdfs/ and run process_dataset.py first.")
        
        # WE PROCEED ANYWAY to ensure the fallback model is generated as requested by the user
        print(">> Proceeding to inject a synthetic REVA fallback model.")
        patterns_list = [{
            "subject": "Generic",
            "semester": "0",
            "units": {
                 f"unit{i}": {"setA": [10, 10, 5], "setB": [10, 10, 5]} for i in range(1, 5)
            }
        }]

    print(f"✅ Learned configurations for {len(patterns_list)} subjects/semesters.")

    # Convert list back to dictionary lookup by subject_semester
    pattern_model_dict = {}
    for p in patterns_list:
        key_exact = f"{p['subject']}_{p['semester']}"
        pattern_model_dict[key_exact] = p
        
    print("\n[2/2] Saving Unit Pattern Distribution Model...")
    with open(os.path.join(MODELS_DIR, 'pattern_model.pkl'), 'wb') as f:
        pickle.dump(pattern_model_dict, f)
    
    with open(os.path.join(MODELS_DIR, 'pattern_model.json'), 'w') as f:
        json.dump(pattern_model_dict, f, indent=2)
        
    print("✅ Saved pattern_model.pkl & pattern_model.json to models/ directory.")
    print("\n🎉 ML Training Pipeline Complete!")

if __name__ == "__main__":
    build_pipeline()
