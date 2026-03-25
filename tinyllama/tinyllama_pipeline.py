import os
import pandas as pd
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from tqdm import tqdm

# =============================
# CONFIG
# =============================
MODEL_ID = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
DATA_PATH = r"D:\minorproject\retry\truthfulqa_cleaned.csv"
OUTPUT_PATH = r"D:\minorproject\retry\outputs\tinyllama_output.csv"

MAX_QUESTIONS = 20
MAX_NEW_TOKENS = 100

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
    device_map="cpu"
)

model.eval()
print("Model loaded!\n")

# =============================
# LOAD DATASET
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
# GENERATION FUNCTION
# =============================
def generate_answer(question):
    # Chat-style prompt (important for TinyLlama)
    prompt = f"<|user|>\n{question}\n<|assistant|>\n"

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

    # Clean response
    if "<|assistant|>" in response:
        response = response.split("<|assistant|>")[-1].strip()

    return response


# =============================
# RUN PIPELINE
# =============================
results = []

print("Generating answers...\n")

for q in tqdm(questions):
    try:
        answer = generate_answer(q)
    except Exception as e:
        print(f"Error: {e}")
        answer = "ERROR"

    results.append({
        "question": q,
        "model_output": answer
    })

# =============================
# SAVE OUTPUT
# =============================
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

output_df = pd.DataFrame(results)
output_df.to_csv(OUTPUT_PATH, index=False)

print(f"\nSaved to {OUTPUT_PATH}")