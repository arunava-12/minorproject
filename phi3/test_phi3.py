from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "microsoft/Phi-3-mini-4k-instruct"

print("Loading model...")

tokenizer = AutoTokenizer.from_pretrained(model_id)

# 🔥 FIX (important)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    dtype=torch.float32,
    device_map="cpu"
)

print("Model loaded ✅")

prompt = """<|system|>
You are a helpful AI.
<|user|>
What happens if you eat watermelon seeds?
<|assistant|>
"""

inputs = tokenizer(prompt, return_tensors="pt", padding=True)

input_ids = inputs["input_ids"]
attention_mask = inputs["attention_mask"]

outputs = model.generate(
    input_ids=input_ids,
    attention_mask=attention_mask,
    max_new_tokens=100
)

response = outputs[0][input_ids.shape[-1]:]

print("\nResponse:\n")
print(tokenizer.decode(response, skip_special_tokens=True))