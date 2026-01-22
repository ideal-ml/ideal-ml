import { Model, User, TrainingPipeline, TrainingRun } from "../types";

export const currentUser: User = {
  id: "user-1",
  name: "Sarah Chen",
  email: "sarah.chen@company.com",
  role: "ML Engineer",
  avatar: undefined,
};

export const initialModels: Model[] = [
  {
    id: "model-1",
    name: "Customer Churn Predictor",
    version: "2.1.0",
    description: "Predicts customer churn probability based on usage patterns and engagement metrics.",
    framework: "PyTorch",
    status: "production",
    owner: "Sarah Chen",
    createdAt: "2024-08-15T10:30:00Z",
    updatedAt: "2024-12-01T14:22:00Z",
    metrics: {
      accuracy: 0.92,
      latency: 45,
    },
    versions: [
      {
        version: "2.1.0",
        datasets: [
          {
            id: "ds-1",
            name: "training_data.csv",
            filePath: "s3://ml-datasets-prod/churn/v2.1.0/training_data.csv",
            description: "Customer usage patterns and churn labels",
            rowCount: 50000,
            columns: ["customer_id", "usage_days", "feature_usage", "support_tickets", "churned"],
            addedAt: "2024-12-01T14:22:00Z",
          },
          {
            id: "ds-2",
            name: "validation_data.csv",
            filePath: "s3://ml-datasets-prod/churn/v2.1.0/validation_data.csv",
            description: "Holdout validation set",
            rowCount: 10000,
            columns: ["customer_id", "usage_days", "feature_usage", "support_tickets", "churned"],
            addedAt: "2024-12-01T14:22:00Z",
          },
        ],
        createdAt: "2024-12-01T14:22:00Z",
        notes: "Added validation dataset for improved evaluation",
      },
      {
        version: "2.0.0",
        datasets: [
          {
            id: "ds-1",
            name: "training_data.csv",
            filePath: "s3://ml-datasets-prod/churn/v2.0.0/training_data.csv",
            description: "Customer usage patterns and churn labels",
            rowCount: 50000,
            columns: ["customer_id", "usage_days", "feature_usage", "support_tickets", "churned"],
            addedAt: "2024-11-15T10:00:00Z",
          },
        ],
        createdAt: "2024-11-15T10:00:00Z",
        notes: "Initial production release",
      },
    ],
  },
  {
    id: "model-2",
    name: "Fraud Detection Model",
    version: "3.0.1",
    description: "Real-time fraud detection for transaction processing with ensemble methods.",
    framework: "TensorFlow",
    status: "production",
    owner: "Mike Johnson",
    createdAt: "2024-06-20T09:00:00Z",
    updatedAt: "2024-11-28T16:45:00Z",
    metrics: {
      accuracy: 0.97,
      latency: 23,
    },
    versions: [
      {
        version: "3.0.1",
        datasets: [
          {
            id: "ds-3",
            name: "transactions_2024.csv",
            filePath: "s3://ml-datasets-prod/fraud/v3.0.1/transactions_2024.csv",
            description: "Transaction records with fraud labels",
            rowCount: 1000000,
            columns: ["tx_id", "amount", "merchant", "location", "time", "is_fraud"],
            addedAt: "2024-11-28T16:45:00Z",
          },
          {
            id: "ds-4",
            name: "synthetic_fraud.csv",
            filePath: "s3://ml-datasets-prod/fraud/v3.0.1/synthetic_fraud.csv",
            description: "Synthetic fraud cases for training balance",
            rowCount: 50000,
            columns: ["tx_id", "amount", "merchant", "location", "time", "is_fraud"],
            addedAt: "2024-11-28T16:45:00Z",
          },
        ],
        createdAt: "2024-11-28T16:45:00Z",
        notes: "Added synthetic data to improve fraud detection recall",
      },
      {
        version: "3.0.0",
        datasets: [
          {
            id: "ds-3",
            name: "transactions_2024.csv",
            filePath: "s3://ml-datasets-prod/fraud/v3.0.0/transactions_2024.csv",
            description: "Transaction records with fraud labels",
            rowCount: 1000000,
            columns: ["tx_id", "amount", "merchant", "location", "time", "is_fraud"],
            addedAt: "2024-10-01T09:00:00Z",
          },
        ],
        createdAt: "2024-10-01T09:00:00Z",
        notes: "Major version upgrade with new model architecture",
      },
    ],
  },
  {
    id: "model-3",
    name: "Product Recommender",
    version: "1.5.0",
    description: "Collaborative filtering model for personalized product recommendations.",
    framework: "PyTorch",
    status: "staging",
    owner: "Sarah Chen",
    createdAt: "2024-10-01T11:15:00Z",
    updatedAt: "2024-12-10T08:30:00Z",
    metrics: {
      accuracy: 0.85,
      latency: 67,
    },
    versions: [
      {
        version: "1.5.0",
        datasets: [
          {
            id: "ds-5",
            name: "user_interactions.csv",
            filePath: "s3://ml-datasets-prod/recommender/v1.5.0/user_interactions.csv",
            description: "User-product interaction history",
            rowCount: 500000,
            columns: ["user_id", "product_id", "action", "timestamp", "rating"],
            addedAt: "2024-12-10T08:30:00Z",
          },
          {
            id: "ds-6",
            name: "product_catalog.csv",
            filePath: "s3://ml-datasets-prod/recommender/v1.5.0/product_catalog.csv",
            description: "Product metadata and categories",
            rowCount: 25000,
            columns: ["product_id", "name", "category", "price", "description"],
            addedAt: "2024-12-10T08:30:00Z",
          },
        ],
        createdAt: "2024-12-10T08:30:00Z",
        notes: "Added product catalog for content-based filtering",
      },
    ],
  },
  {
    id: "model-4",
    name: "Sentiment Analyzer",
    version: "0.9.0",
    description: "NLP model for analyzing customer feedback sentiment across multiple channels.",
    framework: "Hugging Face",
    status: "development",
    owner: "Lisa Park",
    createdAt: "2024-11-15T13:00:00Z",
    updatedAt: "2024-12-12T10:00:00Z",
    metrics: {
      accuracy: 0.78,
      latency: 120,
    },
    versions: [
      {
        version: "0.9.0",
        datasets: [
          {
            id: "ds-7",
            name: "feedback_labeled.csv",
            filePath: "s3://ml-datasets-prod/sentiment/v0.9.0/feedback_labeled.csv",
            description: "Manually labeled customer feedback",
            rowCount: 15000,
            columns: ["feedback_id", "text", "channel", "sentiment", "confidence"],
            addedAt: "2024-12-12T10:00:00Z",
          },
        ],
        createdAt: "2024-12-12T10:00:00Z",
        notes: "Initial development version",
      },
    ],
  },
  {
    id: "model-5",
    name: "Demand Forecaster",
    version: "1.2.3",
    description: "Time series model for predicting product demand and inventory optimization.",
    framework: "scikit-learn",
    status: "staging",
    owner: "Tom Wilson",
    createdAt: "2024-09-10T08:45:00Z",
    updatedAt: "2024-11-30T12:15:00Z",
    metrics: {
      accuracy: 0.88,
      latency: 35,
    },
    versions: [
      {
        version: "1.2.3",
        datasets: [
          {
            id: "ds-8",
            name: "sales_history.csv",
            filePath: "s3://ml-datasets-prod/demand/v1.2.3/sales_history.csv",
            description: "Historical sales data by product and region",
            rowCount: 200000,
            columns: ["date", "product_id", "region", "units_sold", "revenue"],
            addedAt: "2024-11-30T12:15:00Z",
          },
          {
            id: "ds-9",
            name: "seasonal_factors.csv",
            filePath: "s3://ml-datasets-prod/demand/v1.2.3/seasonal_factors.csv",
            description: "Seasonal adjustment factors",
            rowCount: 365,
            columns: ["day_of_year", "season", "holiday_flag", "adjustment_factor"],
            addedAt: "2024-11-30T12:15:00Z",
          },
        ],
        createdAt: "2024-11-30T12:15:00Z",
        notes: "Added seasonal factors for improved accuracy",
      },
    ],
  },
  {
    id: "model-6",
    name: "Legacy Image Classifier",
    version: "1.0.0",
    description: "Original image classification model, deprecated in favor of v2.",
    framework: "TensorFlow",
    status: "archived",
    owner: "Mike Johnson",
    createdAt: "2023-03-20T10:00:00Z",
    updatedAt: "2024-06-15T09:00:00Z",
    metrics: {
      accuracy: 0.72,
      latency: 200,
    },
    versions: [
      {
        version: "1.0.0",
        datasets: [
          {
            id: "ds-10",
            name: "image_labels.csv",
            filePath: "s3://ml-datasets-prod/images/v1.0.0/image_labels.csv",
            description: "Image file paths and classification labels",
            rowCount: 100000,
            columns: ["image_path", "label", "confidence", "annotator"],
            addedAt: "2023-03-20T10:00:00Z",
          },
        ],
        createdAt: "2023-03-20T10:00:00Z",
        notes: "Initial release",
      },
    ],
  },
  {
    id: "model-7",
    name: "Example Classification Model",
    version: "1.0.0",
    description: "A simple classification model demonstrating dataset preview functionality.",
    framework: "scikit-learn",
    status: "development",
    owner: "Sarah Chen",
    createdAt: "2025-01-21T10:00:00Z",
    updatedAt: "2025-01-21T10:00:00Z",
    metrics: {
      accuracy: 0.85,
      latency: 12,
    },
    files: {
      modelCard: "models/example/ModelCard.md",
      trainingScript: "models/example/train.py",
      featureScript: "models/example/features.py",
      inferenceScript: "models/example/inference.py",
    },
    mockContent: {
      modelCard: `# Example Classification Model

## Overview
A simple classification model that predicts labels based on three input features.

## Intended Use
This model is designed for demonstration purposes to showcase the ML platform's dataset preview functionality.

## Training Data
The model was trained on a dataset with 10,000 samples containing:
- Feature 1: Integer values (1-3)
- Feature 2: Integer values (6-8)
- Feature 3: Float values (0.1-0.9)
- Label: Binary classification (0 or 1)

## Performance
- Accuracy: 85%
- Latency: 12ms
`,
      trainingScript: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

def load_data(path: str) -> pd.DataFrame:
    """Load the training dataset from CSV."""
    return pd.read_csv(path)

def preprocess(df: pd.DataFrame) -> tuple:
    """Split features and labels."""
    X = df[["Feature 1", "Feature 2", "Feature 3"]]
    y = df["Label"]
    return X, y

def train_model(X, y):
    """Train a Random Forest classifier."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Model accuracy: {accuracy:.2%}")

    return model

def main():
    df = load_data("src/data/example_dataset.csv")
    X, y = preprocess(df)
    model = train_model(X, y)
    joblib.dump(model, "model.pkl")
    print("Model saved to model.pkl")

if __name__ == "__main__":
    main()
`,
      featureScript: `import pandas as pd
import numpy as np
from typing import Dict, List

def extract_features(raw_data: Dict) -> np.ndarray:
    """
    Extract and normalize features from raw input data.

    Args:
        raw_data: Dictionary containing Feature 1, Feature 2, Feature 3

    Returns:
        Numpy array of processed features
    """
    features = np.array([
        raw_data["Feature 1"],
        raw_data["Feature 2"],
        raw_data["Feature 3"]
    ])

    # Normalize features
    normalized = normalize_features(features)
    return normalized

def normalize_features(features: np.ndarray) -> np.ndarray:
    """Apply min-max normalization."""
    min_vals = np.array([1, 6, 0.1])
    max_vals = np.array([3, 8, 0.9])

    normalized = (features - min_vals) / (max_vals - min_vals)
    return normalized

def batch_extract(data: List[Dict]) -> np.ndarray:
    """Extract features for a batch of samples."""
    return np.array([extract_features(d) for d in data])
`,
      inferenceScript: `import joblib
import numpy as np
from typing import Dict, List
from features import extract_features, batch_extract

class ExampleClassifier:
    """Inference wrapper for the Example Classification Model."""

    def __init__(self, model_path: str = "model.pkl"):
        self.model = joblib.load(model_path)

    def predict(self, raw_data: Dict) -> int:
        """
        Make a single prediction.

        Args:
            raw_data: Dictionary with Feature 1, Feature 2, Feature 3

        Returns:
            Predicted label (0 or 1)
        """
        features = extract_features(raw_data)
        prediction = self.model.predict([features])[0]
        return int(prediction)

    def predict_batch(self, data: List[Dict]) -> List[int]:
        """Make predictions for a batch of samples."""
        features = batch_extract(data)
        predictions = self.model.predict(features)
        return [int(p) for p in predictions]

    def predict_proba(self, raw_data: Dict) -> Dict[str, float]:
        """Get prediction probabilities."""
        features = extract_features(raw_data)
        proba = self.model.predict_proba([features])[0]
        return {"class_0": proba[0], "class_1": proba[1]}

# Example usage
if __name__ == "__main__":
    classifier = ExampleClassifier()

    sample = {"Feature 1": 2, "Feature 2": 7, "Feature 3": 0.5}
    result = classifier.predict(sample)
    print(f"Prediction: {result}")

    proba = classifier.predict_proba(sample)
    print(f"Probabilities: {proba}")
`,
    },
    versions: [
      {
        version: "1.0.0",
        datasets: [
          {
            id: "ds-example",
            name: "example_dataset.csv",
            filePath: "src/data/example_dataset.csv",
            description: "Example training dataset with features and labels",
            rowCount: 10000,
            columns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
            addedAt: "2025-01-21T10:00:00Z",
            previewData: {
              headers: ["Feature 1", "Feature 2", "Feature 3", "Label"],
              rows: [
                ["1", "6", "0.3", "1"],
                ["1", "6", "0.6", "1"],
                ["2", "7", "0.8", "0"],
                ["3", "8", "0.9", "0"],
                ["2", "7", "0.2", "0"],
                ["1", "7", "0.1", "1"],
                ["2", "7", "0.2", "1"],
              ],
            },
          },
        ],
        createdAt: "2025-01-21T10:00:00Z",
        notes: "Initial version with example dataset",
      },
    ],
  },
];

// Mock Training Runs
const mockTrainingRuns: TrainingRun[] = [
  {
    id: "run-001",
    modelId: "model-7",
    datasetId: "ds-example",
    datasetName: "example_dataset.csv",
    status: "completed",
    startedAt: "2025-01-20T14:30:00Z",
    completedAt: "2025-01-20T14:32:45Z",
    metrics: {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.89,
      f1Score: 0.87,
      trainingTime: 165,
      epochs: 100,
    },
    outputModelPath: "models/example/outputs/model_run001.pkl",
    logs: [
      "[2025-01-20 14:30:00] Starting training run...",
      "[2025-01-20 14:30:01] Loading dataset: example_dataset.csv",
      "[2025-01-20 14:30:02] Dataset loaded: 10000 rows, 4 columns",
      "[2025-01-20 14:30:03] Preprocessing data...",
      "[2025-01-20 14:30:05] Training RandomForestClassifier...",
      "[2025-01-20 14:32:40] Training complete. Evaluating...",
      "[2025-01-20 14:32:43] Accuracy: 87.0%",
      "[2025-01-20 14:32:44] Saving model to models/example/outputs/model_run001.pkl",
      "[2025-01-20 14:32:45] Training run completed successfully.",
    ],
    validation: {
      isValid: true,
      datasetColumns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
      expectedColumns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
      missingColumns: [],
      extraColumns: [],
      message: "All 4 required columns found in dataset",
    },
    triggeredBy: "Sarah Chen",
  },
  {
    id: "run-002",
    modelId: "model-7",
    datasetId: "ds-example",
    datasetName: "example_dataset.csv",
    status: "completed",
    startedAt: "2025-01-19T10:15:00Z",
    completedAt: "2025-01-19T10:18:30Z",
    metrics: {
      accuracy: 0.82,
      precision: 0.80,
      recall: 0.84,
      f1Score: 0.82,
      trainingTime: 210,
      epochs: 50,
    },
    outputModelPath: "models/example/outputs/model_run002.pkl",
    logs: [
      "[2025-01-19 10:15:00] Starting training run...",
      "[2025-01-19 10:15:01] Loading dataset: example_dataset.csv",
      "[2025-01-19 10:15:02] Dataset loaded: 10000 rows, 4 columns",
      "[2025-01-19 10:18:28] Training complete. Accuracy: 82.0%",
      "[2025-01-19 10:18:30] Training run completed successfully.",
    ],
    validation: {
      isValid: true,
      datasetColumns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
      expectedColumns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
      missingColumns: [],
      extraColumns: [],
      message: "All 4 required columns found in dataset",
    },
    triggeredBy: "Sarah Chen",
  },
  {
    id: "run-003",
    modelId: "model-7",
    datasetId: "ds-invalid",
    datasetName: "incomplete_data.csv",
    status: "failed",
    startedAt: "2025-01-18T16:00:00Z",
    validation: {
      isValid: false,
      datasetColumns: ["Feature 1", "Feature 2"],
      expectedColumns: ["Feature 1", "Feature 2", "Feature 3", "Label"],
      missingColumns: ["Feature 3", "Label"],
      extraColumns: [],
      message: "Dataset is missing 2 required column(s)",
    },
    triggeredBy: "Mike Johnson",
  },
];

// Mock Training Pipelines
export const mockPipelines: Record<string, TrainingPipeline> = {
  "model-7": {
    modelId: "model-7",
    trainingScriptPath: "models/example/train.py",
    runs: mockTrainingRuns,
  },
  "model-1": {
    modelId: "model-1",
    trainingScriptPath: "models/churn/train.py",
    runs: [],
  },
};
