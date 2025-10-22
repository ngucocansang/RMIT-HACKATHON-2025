import re, warnings
warnings.filterwarnings('ignore')
import pandas as pd
import numpy as np
from scipy.sparse import hstack, csr_matrix
from sklearn.model_selection import StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score
import lightgbm as lgb

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# ---------- Load data ----------
train = pd.read_csv("/kaggle/input/rmit-hackathon-2025/train.csv")
test  = pd.read_csv("/kaggle/input/rmit-hackathon-2025/test.csv")
train.columns = train.columns.str.lower()
test.columns  = test.columns.str.lower()
train["text"] = train["text"].astype(str)
test["text"]  = test["text"].astype(str)

# ---------- Encode labels ----------
label_map = {"benign": 0, "jailbreak": 1}
y = train["label"].map(label_map)

# ---------- Fast text cleaning ----------
def clean_text(s):
    s = s.lower()
    s = re.sub(r"http\S+|www\S+|https\S+", " url ", s)
    s = re.sub(r"[^a-z0-9!? ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

train["clean"] = train["text"].apply(clean_text)
test["clean"]  = test["text"].apply(clean_text)

# ---------- Lightweight feature engineering ----------
def build_feats(df):
    s = df["text"]
    c = df["clean"]
    feats = {
        "len": c.str.len(),
        "words": c.str.split().apply(len),
        "excl": c.str.count("!"),
        "q": c.str.count(r"\?"),
        "url": c.str.contains("url").astype(int),
        "pretend": c.str.contains("pretend|act as|roleplay|imagine").astype(int),
        "jb": c.str.contains("jailbreak|exploit|override|ignore|bypass").astype(int),
        "upper": s.apply(lambda x: sum(1 for c in x if c.isupper())),
    }
    return pd.DataFrame(feats)

f_train = build_feats(train)
f_test  = build_feats(test)

# ---------- Scale engineered features ----------
scaler = StandardScaler()
f_train_s = scaler.fit_transform(f_train)
f_test_s  = scaler.transform(f_test)
f_train_sp = csr_matrix(f_train_s)
f_test_sp  = csr_matrix(f_test_s)

# ---------- TF-IDF (only word bigrams) ----------
tfidf = TfidfVectorizer(
    sublinear_tf=True,
    stop_words="english",
    ngram_range=(1,2),
    max_features=20000,
    min_df=3
)
X_text = tfidf.fit_transform(train["clean"])
X_text_test = tfidf.transform(test["clean"])

# ---------- Combine features ----------
X = hstack([X_text, f_train_sp]).tocsr()
X_test = hstack([X_text_test, f_test_sp]).tocsr()

# ---------- LightGBM CV with 3 folds ----------
kf = StratifiedKFold(n_splits=3, shuffle=True, random_state=RANDOM_STATE)
oof = np.zeros(X.shape[0])
test_preds = np.zeros(X_test.shape[0])

for fold, (train_idx, val_idx) in enumerate(kf.split(X, y), 1):
    print(f"\nFold {fold}")
    X_tr, X_val = X[train_idx], X[val_idx]
    y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]

    model = lgb.LGBMClassifier(
        n_estimators=400,
        learning_rate=0.05,
        max_depth=9,
        num_leaves=64,
        subsample=0.9,
        colsample_bytree=0.8,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )
    model.fit(
        X_tr, y_tr,
        eval_set=[(X_val, y_val)],
        eval_metric="auc",
        callbacks=[lgb.early_stopping(30)],
        verbose=50
    )
    
    oof[val_idx] = model.predict_proba(X_val)[:,1]
    test_preds += model.predict_proba(X_test)[:,1] / kf.n_splits

# ---------- Final AUC ----------
auc = roc_auc_score(y, oof)
print(f"\nOOF AUC: {auc:.5f}")

# ---------- Train on full data ----------
print("\nTraining on full data...")
final_model = lgb.LGBMClassifier(
    n_estimators=400,
    learning_rate=0.05,
    max_depth=9,
    num_leaves=64,
    subsample=0.9,
    colsample_bytree=0.8,
    random_state=RANDOM_STATE,
    n_jobs=-1
)
final_model.fit(X, y)

# ---------- Submission ----------
submission = pd.DataFrame({
    "Id": test["id"] if "id" in test.columns else test.index,
    "TARGET": final_model.predict_proba(X_test)[:,1]
})
submission.to_csv("submission.csv", index=False)
print("✓ submission_fast.csv saved")
