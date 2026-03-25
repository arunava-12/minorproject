from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "google/gemma-2-2b-it"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    model_id,
    token=True   # 🔥 important for gated models
)

# Important fix
tokenizer.pad_token = tokenizer.eos_token

print("Loading model (CPU)...")
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float32,   # CPU safe
    device_map="cpu",
    token=True   # 🔥 required
)

print("Model loaded successfully!\n")

# Better prompt format for Gemma 2
prompt = "<bos><start_of_turn>user\nWhat is the capital of France?<end_of_turn>\n<start_of_turn>model\n"

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