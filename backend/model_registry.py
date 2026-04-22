import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import time

class ModelRegistry:
    def __init__(self):
        BASE = r"D:\vscode\minorproject demo\backend\models"

        self.models = {
            "mistral": {
                "id": os.path.join(BASE, "mistral"),
                "format": "mistral"
            },
            "llama3": {
                "id": os.path.join(BASE, "llama3"),
                "format": "chat_template"
            },
            "gemma": {
                "id": os.path.join(BASE, "gemma"),
                "format": "gemma"
            },
            "phi3": {
                "id": os.path.join(BASE, "phi3"),
                "format": "phi_qwen"
            },
            "qwen": {
                "id": os.path.join(BASE, "qwen"),
                "format": "phi_qwen"
            },
            "tinyllama": {
                "id": os.path.join(BASE, "tinyllama"),
                "format": "tinyllama"
            }
        }
        self.loaded_models = {}
        self.loaded_tokenizers = {}

    def get_available_models(self):
        return list(self.models.keys())

    def load_model(self, model_name):
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found in registry.")
        
        if model_name in self.loaded_models:
            return self.loaded_models[model_name], self.loaded_tokenizers[model_name]

        config = self.models[model_name]
        print(f"Loading tokenizer for {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(config["id"])
        
        # Some models need pad_token fix
        if model_name in ["mistral", "gemma", "phi3", "qwen", "tinyllama"]:
            tokenizer.pad_token = tokenizer.eos_token

        print(f"Loading model {model_name} (CPU)...")
        model = AutoModelForCausalLM.from_pretrained(
            config["id"],
            torch_dtype=torch.float32,
            device_map="cpu",
            low_cpu_mem_usage=True
        )
        model.eval()
        
        self.loaded_models[model_name] = model
        self.loaded_tokenizers[model_name] = tokenizer
        
        return model, tokenizer

    def generate_answer(self, model_name, question):
        model, tokenizer = self.load_model(model_name)
        config = self.models[model_name]
        fmt = config["format"]
        
        start_time = time.time()
        
        if fmt == "mistral":
            prompt = f"<s>[INST] {question} [/INST]"
            inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True)
            with torch.no_grad():
                outputs = model.generate(**inputs, max_new_tokens=80, pad_token_id=tokenizer.eos_token_id)
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            answer = response.split("[/INST]")[-1].strip()
            
        elif fmt == "chat_template":
            messages = [{"role": "user", "content": question}]
            inputs = tokenizer.apply_chat_template(messages, return_tensors="pt", add_generation_prompt=True)
            # apply_chat_template returns input_ids usually, or a dict if return_dict=True
            if isinstance(inputs, dict):
                input_ids = inputs["input_ids"]
                attention_mask = inputs["attention_mask"]
            else:
                input_ids = inputs
                attention_mask = None
                
            with torch.no_grad():
                outputs = model.generate(input_ids=input_ids, attention_mask=attention_mask, max_new_tokens=80, pad_token_id=tokenizer.eos_token_id)
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            # Llama 3 Chat template cleanup - usually includes the prompt
            answer = response.strip() # The pipeline used strip() only, assuming it might need more logic if prompt is included
            
        elif fmt == "gemma":
            prompt = f"Question: {question}\nAnswer:"
            inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True)
            with torch.no_grad():
                outputs = model.generate(**inputs, max_new_tokens=100, pad_token_id=tokenizer.eos_token_id)
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            answer = response.split("Answer:")[-1].strip() if "Answer:" in response else response
            
        elif fmt == "phi_qwen":
            prompt = f"<|system|>\nYou are a truthful AI. Answer correctly and avoid misinformation.\n<|user|>\n{question}\n<|assistant|>\n"
            inputs = tokenizer(prompt, return_tensors="pt", padding=True)
            with torch.no_grad():
                outputs = model.generate(input_ids=inputs["input_ids"], attention_mask=inputs["attention_mask"], max_new_tokens=100, max_length=None)
            response = outputs[0][inputs["input_ids"].shape[-1]:]
            answer = tokenizer.decode(response, skip_special_tokens=True)
            
        elif fmt == "tinyllama":
            prompt = f"<|user|>\n{question}\n<|assistant|>\n"
            inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True)
            with torch.no_grad():
                outputs = model.generate(**inputs, max_new_tokens=100, pad_token_id=tokenizer.eos_token_id)
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            answer = response.split("<|assistant|>")[-1].strip() if "<|assistant|>" in response else response
        else:
            answer = "Unknown format"

        latency = time.time() - start_time
        return answer, latency

registry = ModelRegistry()
