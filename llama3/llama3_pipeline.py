import os
import pandas as pd
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from tqdm import tqdm

# =============================
# CONFIG
# =============================
MODEL_ID = "meta-llama/Meta-Llama-3.1-8B-Instruct"
DATA_PATH = r"D:\minorproject\retry\truthfulqa_cleaned.csv"
OUTPUT_PATH = r"D:\minorproject\retry\outputs\llama3_output.csv"

MAX_QUESTIONS = 100
MAX_NEW_TOKENS = 80   # keep small for CPU

# =============================
# LOAD MODEL
# =============================
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

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
    messages = [
        {"role": "user", "content": question}
    ]

    inputs = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        add_generation_prompt=True
    )

    input_ids = inputs["input_ids"]
    attention_mask = inputs["attention_mask"]

    with torch.no_grad():
        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_new_tokens=MAX_NEW_TOKENS,
            pad_token_id=tokenizer.eos_token_id
        )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return response.strip()


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