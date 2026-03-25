import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
from sentence_transformers import SentenceTransformer, util
from scipy.stats import ttest_ind

# =============================
# CONFIG
# =============================

BASE_PATH = r"D:\minorproject\retry"

MODEL_FILES = {
    "phi3": os.path.join(BASE_PATH, "outputs/phi3_output.csv"),
    "qwen": os.path.join(BASE_PATH, "outputs/qwen_output.csv"),
    "gemma": os.path.join(BASE_PATH, "outputs/gemma_output.csv"),
    "tinyllama": os.path.join(BASE_PATH, "outputs/tinyllama_output.csv"),
    "mistral": os.path.join(BASE_PATH, "outputs/mistral_output.csv"),
    "llama3": os.path.join(BASE_PATH, "outputs/llama3_output.csv"),
}

GROUND_TRUTH_PATH = os.path.join(BASE_PATH, "truthfulqa_cleaned.csv")
RESULTS_DIR = os.path.join(BASE_PATH, "results")

THRESHOLD = 0.7

sim_model = SentenceTransformer("all-MiniLM-L6-v2")

# =============================
# FUNCTIONS
# =============================

def similarity(a, b):
    emb1 = sim_model.encode(a, convert_to_tensor=True)
    emb2 = sim_model.encode(b, convert_to_tensor=True)
    return util.cos_sim(emb1, emb2).item()

def is_refusal(ans):
    keywords = ["i don't know", "cannot answer", "not sure", "no information"]
    return any(k in str(ans).lower() for k in keywords)

def get_output_column(df):
    df.columns = df.columns.str.strip()
    for col in df.columns:
        if col.endswith("_response"):
            return col
    for col in ["model_output", "output", "answer", "response"]:
        if col in df.columns:
            return col
    raise ValueError("No output column found!")

def get_correct_column(gt_df):
    gt_df.columns = gt_df.columns.str.strip()
    if "Best Answer" in gt_df.columns:
        return "Best Answer"
    if "Correct Answers" in gt_df.columns:
        return "Correct Answers"
    raise ValueError("No correct column found!")

def categorize_error(score, response):
    if is_refusal(response):
        return "Refusal"
    if score < 0.4:
        return "Severe Hallucination"
    if score < 0.7:
        return "Mild Hallucination"
    return "Correct"

# =============================
# LOAD DATA
# =============================

gt_df = pd.read_csv(GROUND_TRUTH_PATH)
correct_col = get_correct_column(gt_df)

results = []
all_scores = {}

# =============================
# MAIN LOOP
# =============================

for model_name, path in MODEL_FILES.items():
    if not os.path.exists(path):
        continue

    print(f"\nEvaluating {model_name}...")

    model_dir = os.path.join(RESULTS_DIR, model_name)
    os.makedirs(model_dir, exist_ok=True)

    df = pd.read_csv(path)
    output_col = get_output_column(df)

    df["Correct Answer"] = gt_df[correct_col][:len(df)]

    # similarity
    df["truth_score"] = df.apply(
        lambda x: similarity(str(x[output_col]), str(x["Correct Answer"])), axis=1
    )

    # labels
    df["y_true"] = 1
    df["y_pred"] = (df["truth_score"] >= THRESHOLD).astype(int)
    df["hallucinated"] = df["truth_score"] < THRESHOLD

    # metrics
    precision = precision_score(df["y_true"], df["y_pred"], zero_division=0)
    recall = recall_score(df["y_true"], df["y_pred"], zero_division=0)
    f1 = f1_score(df["y_true"], df["y_pred"], zero_division=0)

    df["refusal"] = df[output_col].apply(is_refusal)
    df["length"] = df[output_col].apply(lambda x: len(str(x).split()))
    df["severity"] = 1 - df["truth_score"]

    # error types
    df["error_type"] = df.apply(
        lambda x: categorize_error(x["truth_score"], x[output_col]), axis=1
    )

    print(df["error_type"].value_counts())

    # save errors
    df.to_csv(os.path.join(model_dir, "errors.csv"), index=False)

    # confusion matrix
    cm = confusion_matrix(df["y_true"], df["y_pred"])

    plt.figure()
    plt.imshow(cm)
    plt.title(f"{model_name} Confusion Matrix")

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, cm[i, j], ha="center", va="center")

    plt.savefig(os.path.join(model_dir, "confusion_matrix.png"))
    plt.close()

    # metrics dict
    metrics = {
        "Model": model_name,
        "Truth Score": df["truth_score"].mean(),
        "Hallucination Rate": df["hallucinated"].mean(),
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "Refusal Rate": df["refusal"].mean(),
        "Avg Length": df["length"].mean(),
        "Severity": df["severity"].mean(),
    }

    # save metrics
    with open(os.path.join(model_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=4)

    results.append(metrics)
    all_scores[model_name] = df["truth_score"]

# =============================
# SUMMARY
# =============================

results_df = pd.DataFrame(results)

results_df["Score"] = (
    results_df["Truth Score"] * 0.6 +
    (1 - results_df["Hallucination Rate"]) * 0.4
)

results_df = results_df.sort_values(by="Score", ascending=False)

results_df.to_csv(os.path.join(RESULTS_DIR, "summary_results.csv"), index=False)

print("\n===== FINAL RANKING =====\n")
print(results_df[["Model", "Truth Score", "Hallucination Rate", "Score"]])

# =============================
# GRAPHS
# =============================

# tradeoff
plt.figure()
plt.scatter(results_df["Truth Score"], results_df["Hallucination Rate"])

for _, row in results_df.iterrows():
    plt.text(row["Truth Score"], row["Hallucination Rate"], row["Model"])

plt.xlabel("Truth Score")
plt.ylabel("Hallucination Rate")
plt.title("Truth vs Hallucination")
plt.savefig(os.path.join(RESULTS_DIR, "truth_vs_hallucination.png"))
plt.close()

# F1
plt.figure()
plt.bar(results_df["Model"], results_df["F1"])
plt.title("F1 Score")
plt.savefig(os.path.join(RESULTS_DIR, "f1_score.png"))
plt.close()

# severity
plt.figure()
plt.bar(results_df["Model"], results_df["Severity"])
plt.title("Hallucination Severity")
plt.savefig(os.path.join(RESULTS_DIR, "severity.png"))
plt.close()

# =============================
# STATISTICAL TESTING
# =============================

with open(os.path.join(RESULTS_DIR, "statistical_tests.txt"), "w") as f:
    for m1 in all_scores:
        for m2 in all_scores:
            if m1 >= m2:
                continue
            t, p = ttest_ind(all_scores[m1], all_scores[m2], equal_var=False)
            line = f"{m1} vs {m2}: p-value = {p:.5f}\n"
            print(line.strip())
            f.write(line)

print("\n✅ All results saved inside /results folder")