import os
import pandas as pd
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from tqdm import tqdm

# =============================
# CONFIG
# =============================
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.1"
DATA_PATH = r"D:\minorproject\retry\truthfulqa_cleaned.csv"
OUTPUT_PATH = r"D:\minorproject\retry\outputs\mistral_output.csv"

MAX_QUESTIONS = 100
MAX_NEW_TOKENS = 80   # keep smaller for CPU

# =============================
# LOAD MODEL
# =============================
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

tokenizer.pad_token = tokenizer.eos_token

print("Loading model (CPU)...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float32,
    device_map="cpu",
    low_cpu_mem_usage=True
)

model.eval()
print("Model loaded!\n")

# =============================
# LOAD DATA
# =============================
df = pd.read_csv(DATA_PATH)

if "question" in df.columns:
    questions = df["question"].tolist()
elif "Question" in df.columns:
    questions = df["Question"].tolist()
else:
    raise ValueError("No question column found!")

questions = questions[:MAX_QUESTIONS]

# =============================
# GENERATE
# =============================
def generate_answer(question):
    prompt = f"<s>[INST] {question} [/INST]"

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        padding=True,
        truncation=True
    )

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            pad_token_id=tokenizer.eos_token_id
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return response.split("[/INST]")[-1].strip()


# =============================
# RUN
# =============================
results = []

print("Generating answers...\n")

for q in tqdm(questions):
    try:
        ans = generate_answer(q)
    except Exception as e:
        print("Error:", e)
        ans = "ERROR"

    results.append({
        "question": q,
        "model_output": ans
    })

# =============================
# SAVE
# =============================
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

pd.DataFrame(results).to_csv(OUTPUT_PATH, index=False)

print(f"\nSaved to {OUTPUT_PATH}")