import os
import json
import ast
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.metrics import confusion_matrix, f1_score

LABEL_MAP = {
    "Correct": 0,
    "Mild Hallucination": 1,
    "Severe Hallucination": 2,
    "Strongly Correct": 3,
    "Refusal": 4
}

# =============================
# CONFIG  ← update BASE_PATH
# =============================

BASE_PATH = r"D:\minorproject\retry"

MODEL_FILES = {
    "phi3":     os.path.join(BASE_PATH, "outputs/phi3_output.csv"),
    "qwen":     os.path.join(BASE_PATH, "outputs/qwen_output.csv"),
    "gemma":    os.path.join(BASE_PATH, "outputs/gemma_output.csv"),
    "tinyllama":os.path.join(BASE_PATH, "outputs/tinyllama_output.csv"),
    "mistral":  os.path.join(BASE_PATH, "outputs/mistral_output.csv"),
    "llama3":   os.path.join(BASE_PATH, "outputs/llama3_output.csv"),
}

GROUND_TRUTH_PATH = os.path.join(BASE_PATH, "truthfulqa_cleaned.csv")
RESULTS_DIR = os.path.join(BASE_PATH, "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

from sentence_transformers import CrossEncoder
cross_encoder = CrossEncoder("BAAI/bge-reranker-large")

# =============================
# UTIL FUNCTIONS
# =============================

def parse_answers(ans):
    if pd.isna(ans):
        return []
    try:
        return ast.literal_eval(ans)
    except:
        return [str(ans)]

def batch_max_similarity(outputs, answer_lists):
    all_pairs = []
    mapping = []

    for i, (out, answers) in enumerate(zip(outputs, answer_lists)):
        for ans in answers:
            all_pairs.append([str(out), str(ans)])
            mapping.append(i)

    if not all_pairs:
        return np.zeros(len(outputs))

    scores = cross_encoder.predict(all_pairs)

    max_scores = np.full(len(outputs), -np.inf)
    for idx, score in zip(mapping, scores):
        if score > max_scores[idx]:
            max_scores[idx] = score

    max_scores[max_scores == -np.inf] = 0
    return max_scores

def is_refusal(ans):
    keywords = [
        "i don't know", "not sure", "cannot answer",
        "no information", "unknown", "unclear"
    ]
    return any(k in str(ans).lower() for k in keywords)

def get_output_column(df):
    df.columns = df.columns.str.strip()
    for col in df.columns:
        if col.endswith("_response"):
            return col
    for col in ["model_output", "output", "answer", "response"]:
        if col in df.columns:
            return col
    raise ValueError(f"No output column found! Columns present: {df.columns.tolist()}")

def find_best_threshold(scores, y_true):
    if len(np.unique(y_true)) < 2:
        return 0.0, 0.0
    thresholds = np.linspace(scores.min(), scores.max(), 100)
    best_t, best_f1 = 0.0, 0.0
    for t in thresholds:
        y_pred = (scores >= t).astype(int)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_t = t
    return best_t, best_f1

# =============================
# LOAD GROUND TRUTH
# =============================

gt_df = pd.read_csv(GROUND_TRUTH_PATH)
gt_df["correct_list"]   = gt_df["Correct Answers"].apply(parse_answers)
gt_df["incorrect_list"] = gt_df["Incorrect Answers"].apply(parse_answers)

results = []
all_scores = {}

# =============================
# MAIN LOOP
# =============================

for model_name, path in MODEL_FILES.items():
    if not os.path.exists(path):
        print(f"⚠️  Skipping {model_name} — file not found: {path}")
        continue

    print(f"\n{'='*50}")
    print(f"Evaluating {model_name}...")

    model_dir = os.path.join(RESULTS_DIR, model_name)
    os.makedirs(model_dir, exist_ok=True)

    df = pd.read_csv(path)
    output_col = get_output_column(df)

    # ── FIX 1: align to ground truth length ──────────────────────────────────
    # Ground truth has 817 rows; model outputs may have more (duplicates/extras).
    # We match by question text if possible, otherwise truncate to gt length.
    if "question" in df.columns and "Question" in gt_df.columns:
        df = df.merge(
            gt_df[["Question", "correct_list", "incorrect_list"]],
            left_on="question", right_on="Question",
            how="inner"
        ).drop(columns=["Question"])
        if len(df) == 0:
            # Fallback: plain truncation (question text didn't match)
            print(f"  ⚠️  Question merge returned 0 rows for {model_name}, falling back to truncation.")
            df = pd.read_csv(path)
            output_col = get_output_column(df)
            n = min(len(df), len(gt_df))
            df = df.iloc[:n].copy().reset_index(drop=True)
            df["correct_list"]   = gt_df["correct_list"].iloc[:n].values
            df["incorrect_list"] = gt_df["incorrect_list"].iloc[:n].values
    else:
        n = min(len(df), len(gt_df))
        df = df.iloc[:n].copy().reset_index(drop=True)
        df["correct_list"]   = gt_df["correct_list"].iloc[:n].values
        df["incorrect_list"] = gt_df["incorrect_list"].iloc[:n].values

    print(f"  Rows after alignment: {len(df)}")

    # ── FIX 2: error_type does NOT exist yet — don't read it here ────────────
    # It will be computed below via categorize_error().

    # =============================
    # SCORE COMPUTATION
    # =============================

    df["score_correct"]   = batch_max_similarity(df[output_col].tolist(), df["correct_list"].tolist())
    df["score_incorrect"] = batch_max_similarity(df[output_col].tolist(), df["incorrect_list"].tolist())
    df["truth_score"]     = df["score_correct"] - df["score_incorrect"]

    # =============================
    # BINARY LABELS & THRESHOLD
    # =============================

    df["y_true"] = (df["score_correct"] > df["score_incorrect"]).astype(int)

    scores = df["truth_score"].values
    y_true = df["y_true"].values

    best_t, best_f1 = find_best_threshold(scores, y_true)
    print(f"  Best threshold: {best_t:.4f} | F1: {best_f1:.4f}")

    df["y_pred"]      = (scores >= best_t).astype(int)
    df["hallucinated"] = df["y_pred"] == 0

    # =============================
    # METRICS
    # =============================

    accuracy           = (df["y_pred"] == df["y_true"]).mean()
    hallucination_rate = (df["y_pred"] == 0).mean()

    roc_auc = pr_auc = None
    if len(np.unique(y_true)) > 1:
        from sklearn.metrics import roc_auc_score, average_precision_score
        roc_auc = roc_auc_score(y_true, scores)
        pr_auc  = average_precision_score(y_true, scores)

    # =============================
    # EXTRA FEATURES
    # =============================

    df["refusal"]  = df[output_col].apply(is_refusal)
    df["length"]   = df[output_col].apply(lambda x: len(str(x).split()))
    df["severity"] = df["score_incorrect"] - df["score_correct"]

    # =============================
    # ERROR TYPE CLASSIFICATION
    # =============================

    mean_diff = df["truth_score"].mean()
    std_diff  = df["truth_score"].std()

    def categorize_error(row):
        if row["refusal"]:
            return "Refusal"
        diff = row["truth_score"]
        if diff > mean_diff + std_diff:
            return "Strongly Correct"
        elif diff > mean_diff:
            return "Correct"
        elif diff > mean_diff - std_diff:
            return "Mild Hallucination"
        else:
            return "Severe Hallucination"

    df["error_type"] = df.apply(categorize_error, axis=1)

    print(f"\n  Error type counts:\n{df['error_type'].value_counts().to_string()}")

    # =============================
    # SAVE ERRORS CSV
    # =============================

    df.to_csv(os.path.join(model_dir, "errors.csv"), index=False)

    # =============================
    # CONFUSION MATRIX
    # =============================

    labels      = list(LABEL_MAP.keys())
    label_codes = list(LABEL_MAP.values())

    cm = confusion_matrix(df["y_true"], df["y_pred"])
    cm = cm.astype("float") / (cm.sum(axis=1, keepdims=True) + 1e-8)

    plt.figure()
    plt.imshow(cm, cmap="Blues")
    plt.title(f"{model_name} Confusion Matrix")

    labels = ["Incorrect / Hallucinated", "Correct"]
    plt.xticks([0, 1], labels)
    plt.yticks([0, 1], labels)

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, f"{cm[i, j]:.2f}", ha="center", va="center")

    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(model_dir, "confusion_matrix.png"))
    plt.close()

    # =============================
    # CLASSIFICATION REPORT
    # =============================

    from sklearn.metrics import classification_report

    # Ensure y_true and y_pred are integers (VERY IMPORTANT)
    y_true = df["y_true"].astype(int)
    y_pred = df["y_pred"].astype(int)

    print(f"\n📊 {model_name} Binary Classification Report:")
    print(classification_report(y_true, y_pred, zero_division=0))

    # Generate report as dict
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)

    # Ensure directory exists before saving
    os.makedirs(model_dir, exist_ok=True)

    # Save JSON safely
    with open(os.path.join(model_dir, "classification_report.json"), "w") as f:
        json.dump(report, f, indent=4)

    # =============================
    # METRICS DICT
    # =============================

    metrics = {
        "Model":             model_name,
        "Truth Score":       float(df["truth_score"].mean()),
        "Accuracy":          float(accuracy),
        "Hallucination Rate":float(hallucination_rate),
        "ROC-AUC":           float(roc_auc) if roc_auc is not None else None,
        "F1":                float(best_f1),
        "PR-AUC":            float(pr_auc)  if pr_auc  is not None else None,
        "Refusal Rate":      float(df["refusal"].mean()),
        "Avg Length":        float(df["length"].mean()),
        "Severity":          float(df["severity"].mean()),
    }

    with open(os.path.join(model_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=4, default=lambda x: float(x) if isinstance(x, (np.floating, np.integer)) else x)

    results.append(metrics)
    all_scores[model_name] = df["truth_score"]

# =============================
# SUMMARY
# =============================

if not results:
    print("\n❌ No models evaluated — check that output CSV paths exist.")
else:
    results_df = pd.DataFrame(results).sort_values("Accuracy", ascending=False)
    results_df.to_csv(os.path.join(RESULTS_DIR, "summary_results.csv"), index=False)
    print("\n===== FINAL RANKING =====\n")
    print(results_df[["Model", "Accuracy", "Hallucination Rate"]].to_string(index=False))

    # ── LEADERBOARD PLOTS ────────────────────────────────────────────────────

    plt.figure()
    plt.bar(results_df["Model"], results_df["Accuracy"])
    plt.xticks(rotation=45)
    plt.title("Model Accuracy Comparison")
    plt.xlabel("Model"); plt.ylabel("Accuracy")
    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "accuracy_comparison.png"))
    plt.close()

    if results_df["ROC-AUC"].notna().any():
        plt.figure()
        plt.bar(results_df["Model"], results_df["ROC-AUC"].fillna(0))
        plt.xticks(rotation=45)
        plt.title("Model ROC-AUC Comparison")
        plt.xlabel("Model"); plt.ylabel("ROC-AUC")
        plt.tight_layout()
        plt.savefig(os.path.join(RESULTS_DIR, "roc_auc_comparison.png"))
        plt.close()

    # ── COMBINED ANALYSIS ────────────────────────────────────────────────────

    errors_paths = {
        m: os.path.join(RESULTS_DIR, m, "errors.csv")
        for m in MODEL_FILES
        if os.path.exists(os.path.join(RESULTS_DIR, m, "errors.csv"))
    }

    if errors_paths:
        combined_df = pd.concat(
            [pd.read_csv(p).assign(Model=m) for m, p in errors_paths.items()],
            ignore_index=True
        )

        # Length vs Truth Score
        plt.figure()
        plt.scatter(combined_df["length"], combined_df["truth_score"], alpha=0.3, s=5)
        plt.xlabel("Response Length"); plt.ylabel("Truth Score")
        plt.title("Length vs Truth Score")
        plt.tight_layout()
        plt.savefig(os.path.join(RESULTS_DIR, "length_vs_truth.png"))
        plt.close()

        # Error distribution
        error_counts = combined_df.groupby(["Model", "error_type"]).size().unstack(fill_value=0)
        error_counts.plot(kind="bar", stacked=True, figsize=(10, 5))
        plt.title("Error Type Distribution per Model")
        plt.xlabel("Model"); plt.ylabel("Count")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(RESULTS_DIR, "error_distribution.png"))
        plt.close()

        # Correlation
        corr = combined_df[["truth_score", "length"]].corr()
        print("\nCorrelation Matrix:\n", corr)
        plt.figure()
        plt.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
        plt.xticks(range(len(corr)), corr.columns, rotation=45)
        plt.yticks(range(len(corr)), corr.columns)
        for i in range(len(corr)):
            for j in range(len(corr)):
                plt.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center")
        plt.title("Correlation Matrix")
        plt.tight_layout()
        plt.savefig(os.path.join(RESULTS_DIR, "correlation_matrix.png"))
        plt.close()

        # Calibration
        from sklearn.calibration import calibration_curve
        plt.figure()
        for m, p in errors_paths.items():
            df_c = pd.read_csv(p)
            y_t = df_c["y_true"].values
            s   = df_c["truth_score"].values
            if len(np.unique(y_t)) < 2:
                continue
            probs = (s - s.min()) / (s.max() - s.min() + 1e-8)
            frac_pos, mean_pred = calibration_curve(y_t, probs, n_bins=10)
            plt.plot(mean_pred, frac_pos, marker='o', label=m)
        plt.plot([0, 1], [0, 1], linestyle='--', label="Perfect")
        plt.xlabel("Predicted Probability"); plt.ylabel("True Probability")
        plt.title("Calibration Curve")
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(RESULTS_DIR, "calibration_curve.png"))
        plt.close()

        # Question difficulty
        difficulty = combined_df.groupby(combined_df.index % len(gt_df))["hallucinated"].mean()
        plt.figure()
        plt.hist(difficulty, bins=20)
        plt.title("Question Difficulty Distribution")
        plt.xlabel("Hallucination Rate across models"); plt.ylabel("Number of Questions")
        plt.tight_layout()
        plt.savefig(os.path.join(RESULTS_DIR, "difficulty_distribution.png"))
        plt.close()

print("\n✅ DONE — Evaluation complete.")