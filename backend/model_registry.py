import os
import gc
import time
import re
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

torch.set_num_threads(8)
torch.set_num_interop_threads(8)

def clean_answer(text):
    text = str(text)

    # remove chat markers and everything after them
    stop_markers = [
        "<|user|>", "<|assistant|>", "<|system|>",
        "[INST]", "[/INST]"
    ]

    for marker in stop_markers:
        if marker in text:
            text = text.split(marker)[0]

    text = text.replace("**", "")
    text = text.replace("*", "")
    text = text.replace("```", "")

    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text).strip()

    text = re.sub(r"\b\w+\-$", "", text).strip()
    text = text.rstrip(",;:- ")

    return text.strip()

class ModelRegistry:
    def __init__(self):
        BASE = r"D:\vscode\minorproject demo\backend\models"

        self.models = {
            "mistral": {"id": os.path.join(BASE, "mistral"), "format": "mistral"},
            "llama3": {"id": os.path.join(BASE, "llama3"), "format": "chat_template"},
            "gemma": {"id": os.path.join(BASE, "gemma"), "format": "gemma"},
            "phi3": {"id": os.path.join(BASE, "phi3"), "format": "phi_qwen"},
            "qwen": {"id": os.path.join(BASE, "qwen"), "format": "phi_qwen"},
            "tinyllama": {"id": os.path.join(BASE, "tinyllama"), "format": "tinyllama"},
        }

        self.loaded_model = None
        self.loaded_tokenizer = None
        self.current_model_name = None

    def get_available_models(self):
        return list(self.models.keys())

    def unload_models(self):
        self.loaded_model = None
        self.loaded_tokenizer = None
        self.current_model_name = None
        gc.collect()

    def load_model(self, model_name):
        if model_name not in self.models:
            raise ValueError(f"{model_name} not found")

        if self.current_model_name == model_name:
            return self.loaded_model, self.loaded_tokenizer

        self.unload_models()

        config = self.models[model_name]

        print(f"Loading tokenizer for {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(
            config["id"],
            use_fast=True
        )

        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        print(f"Loading model for {model_name}...")

        try:
            dtype = torch.float16
            model = AutoModelForCausalLM.from_pretrained(
                config["id"],
                dtype=dtype,
                low_cpu_mem_usage=True
            )
        except Exception:
            model = AutoModelForCausalLM.from_pretrained(
                config["id"],
                dtype=torch.float32,
                low_cpu_mem_usage=True
            )

        model.eval()

        self.loaded_model = model
        self.loaded_tokenizer = tokenizer
        self.current_model_name = model_name

        return model, tokenizer

    def generate_answer(self, model_name, question):
        model, tokenizer = self.load_model(model_name)
        fmt = self.models[model_name]["format"]

        start = time.time()

        if fmt == "mistral":
            prompt = f"<s>[INST] {question} [/INST]"
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True)

        elif fmt == "chat_template":
            messages = [{"role": "user", "content": question}]
            prompt = tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True)

        elif fmt == "gemma":
            prompt = f"Question: {question}\nAnswer:"
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True)

        elif fmt == "phi_qwen":
            prompt = f"<|system|>\nYou are truthful.\n<|user|>\n{question}\n<|assistant|>\n"
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True)

        elif fmt == "tinyllama":
            prompt = f"<|user|>\n{question}\n<|assistant|>\n"
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True)

        else:
            raise ValueError("Unknown format")

        max_tokens = 120

        if model_name in ["tinyllama", "qwen"]:
            max_tokens = 140

        if model_name in ["llama3", "mistral"]:
            max_tokens = 100

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=False,
                use_cache=True,
                pad_token_id=tokenizer.eos_token_id
            )

        generated = outputs[0][inputs["input_ids"].shape[-1]:]

        answer = tokenizer.decode(
            generated,
            skip_special_tokens=True
        )

        answer = clean_answer(answer)

        latency = time.time() - start
        return answer, latency


registry = ModelRegistry()