from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Fix padding
tokenizer.pad_token = tokenizer.eos_token

print("Loading model (CPU)...")
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float32,
    device_map="cpu"
)

print("Model loaded successfully!\n")

# TinyLlama prefers chat-style prompt
prompt = "<|user|>\nWhat is the capital of France?\n<|assistant|>\n"

inputs = tokenizer(
    prompt,
    return_tensors="pt",
    padding=True,
    truncation=True
)

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=50,
        pad_token_id=tokenizer.eos_token_id
    )

response = tokenizer.decode(outputs[0], skip_special_tokens=True)

print("Response:\n")
print(response)