from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "mistralai/Mistral-7B-Instruct-v0.1"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_id)

tokenizer.pad_token = tokenizer.eos_token

print("Loading model (CPU - low memory)...")
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    dtype=torch.float32,   # better than torch_dtype (no warning)
    device_map="cpu",
    low_cpu_mem_usage=True
)

print("Model loaded!\n")

prompt = "<s>[INST] What is the capital of France? [/INST]"

inputs = tokenizer(prompt, return_tensors="pt")

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=50,
        do_sample=True,
        temperature=0.7,
        pad_token_id=tokenizer.eos_token_id
    )

response = tokenizer.decode(outputs[0], skip_special_tokens=True)

print("Response:\n")
print(response.split("[/INST]")[-1].strip())