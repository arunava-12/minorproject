export interface ModelMetric {
  Model: string;
  Accuracy: number;
  "Hallucination Rate": number;
  F1: number;
  "Truth Score": number;
  "Refusal Rate": number;
  "Avg Length": number;
}

export const modelData: ModelMetric[] = [
  {
    "Model": "gemma",
    "Accuracy": 0.91375,
    "Hallucination Rate": 0.52,
    "F1": 0.9012875536,
    "Truth Score": -0.1277961504,
    "Refusal Rate": 0.055,
    "Avg Length": 42.4125
  },
  {
    "Model": "llama3",
    "Accuracy": 0.90875,
    "Hallucination Rate": 0.34625,
    "F1": 0.9249743062,
    "Truth Score": 0.0624250636,
    "Refusal Rate": 0.55375,
    "Avg Length": 36.13625
  },
  {
    "Model": "mistral",
    "Accuracy": 0.9475,
    "Hallucination Rate": 0.3875,
    "F1": 0.9552238805,
    "Truth Score": 0.0567474598,
    "Refusal Rate": 0.0075,
    "Avg Length": 44.80625
  },
  {
    "Model": "phi3",
    "Accuracy": 0.94625,
    "Hallucination Rate": 0.63875,
    "F1": 0.9307568438,
    "Truth Score": -0.0938492169,
    "Refusal Rate": 0.0025,
    "Avg Length": 56.9225
  },
  {
    "Model": "qwen",
    "Accuracy": 0.94,
    "Hallucination Rate": 0.735,
    "F1": 0.8983050847,
    "Truth Score": -0.1732431018,
    "Refusal Rate": 0.00375,
    "Avg Length": 61.4
  },
  {
    "Model": "tinyllama",
    "Accuracy": 0.915,
    "Hallucination Rate": 0.745,
    "F1": 0.8571428571,
    "Truth Score": -0.1709007101,
    "Refusal Rate": 0.0175,
    "Avg Length": 40.89875
  }
];
