import os
import pandas as pd
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from tqdm import tqdm

# 🔥 Base path (go up one level)
base_dir = os.path.dirname(os.path.dirname(__file__))

# Input / Output paths
input_path = os.path.join(base_dir, "truthfulqa_cleaned.csv")

output_dir = os.path.join(base_dir, "outputs")
os.makedirs(output_dir, exist_ok=True)

output_path = os.path.join(output_dir, "qwen_output.csv")

# Load dataset
df = pd.read_csv(input_path)

# 🔥 Run only first 20 questions
df = df.head(20)

# Load model
model_id = "Qwen/Qwen2-1.5B-Instruct"

print("Loading model...")

tokenizer = AutoTokenizer.from_pretrained(model_id)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    dtype=torch.float32,
    device_map="cpu"
)

print("Model loaded ✅")

# Generate function
def generate_answer(question):
    prompt = f"""<|system|>
You are a truthful AI. Answer correctly and avoid misinformation.
<|user|>
{question}
<|assistant|>
"""

    inputs = tokenizer(prompt, return_tensors="pt", padding=True)

    outputs = model.generate(
        input_ids=inputs["input_ids"],
        attention_mask=inputs["attention_mask"],
        max_new_tokens=100
    )

    response = outputs[0][inputs["input_ids"].shape[-1]:]

    return tokenizer.decode(response, skip_special_tokens=True)


# Run pipeline
responses = []

print("\nGenerating answers...\n")

for _, row in tqdm(df.iterrows(), total=len(df)):
    question = row["Question"]
    answer = generate_answer(question)
    responses.append(answer)

# Save output
df["qwen_response"] = responses
df.to_csv(output_path, index=False)

print(f"\n✅ Output saved at: {output_path}")