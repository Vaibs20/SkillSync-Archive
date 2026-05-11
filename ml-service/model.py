import re
from difflib import SequenceMatcher

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class SkillSyncModel:
    def __init__(self, csv_path=None):
        # CSV is kept optional for compatibility with the older service shape.
        print("ML Model Ready (MongoDB mode)")
        self.vectorizer = TfidfVectorizer(stop_words="english")

    def _availability_score(self, val):
        try:
            hours = int(str(val).split("-")[0].strip())
            return (hours / 20) * 50
        except Exception:
            return 0

    def _normalize_identity(self, value):
        return re.sub(r"\s+", " ", str(value or "")).strip().lower()

    def _normalize_email(self, value):
        return str(value or "").strip().lower()

    def _tokens(self, value):
        return [token for token in re.split(r"[^a-z0-9]+", value) if token]

    def _to_search_text(self, value):
        if value is None:
            return ""
        if isinstance(value, (list, tuple, set)):
            return " ".join(str(item) for item in value if item is not None)
        return str(value)

    def _criteria_value(self, criteria, key, default=""):
        value = criteria.get(key, default) if criteria else default
        return value if value is not None else default

    def _has_identity_criteria(self, name_query, email_query):
        return bool(name_query or email_query)

    def _phrase_match(self, query, candidate):
        if not query or not candidate:
            return 0, 0

        if candidate == query:
            return 30, 100

        if query in candidate:
            return 20, 85

        query_tokens = self._tokens(query)
        candidate_tokens = self._tokens(candidate)

        if len(query_tokens) > 1 and all(
            any(candidate_token.startswith(query_token) or query_token in candidate_token for candidate_token in candidate_tokens)
            for query_token in query_tokens
        ):
            return 18, 78

        if len(query) >= 3:
            phrase_ratio = SequenceMatcher(None, query, candidate).ratio()
            token_ratio = max(
                [SequenceMatcher(None, query, candidate_token).ratio() for candidate_token in candidate_tokens],
                default=0,
            )

            if phrase_ratio >= 0.82 or token_ratio >= 0.86:
                return 10, round(max(phrase_ratio, token_ratio) * 75)

        return 0, 0

    def _email_match(self, query, candidate):
        if not query or not candidate:
            return 0, 0

        if candidate == query:
            return 40, 100

        if query in candidate:
            return 25, 85

        return 0, 0

    def _identity_match(self, row, name_query, email_query):
        name_rank, name_score = self._phrase_match(name_query, row["_normalized_name"])
        email_rank, email_score = self._email_match(email_query, row["_normalized_email"])

        if name_rank == 30 and email_rank == 40:
            return 50, 100

        return max(name_rank, email_rank), max(name_score, email_score)

    def _add_similarity_scores(self, df, query):
        if query:
            try:
                self.vectorizer.fit(df["combined_skills"])
                tfidf_matrix = self.vectorizer.transform(df["combined_skills"])
                query_vector = self.vectorizer.transform([query])
                df["skill_score"] = cosine_similarity(query_vector, tfidf_matrix).flatten() * 100
            except ValueError:
                df["skill_score"] = 0
        else:
            df["skill_score"] = 0

        df["known_skills_score"] = df["known_skills"].apply(lambda x: 100 if query and query in x else 0)
        df["learning_goal_score"] = df["learning_goal"].apply(lambda x: 80 if query and query in x else 0)
        df["career_path_score"] = df["career_path"].apply(lambda x: 60 if query and query in x else 0)

        max_year = df["passing_year"].max()
        df["passing_year_score"] = df["passing_year"].apply(
            lambda x: (x / max_year) * 50 if max_year else 0
        )
        df["availability_score"] = df["availability"].apply(self._availability_score)

        df["final_score"] = (
            df["skill_score"] * 0.4
            + df["known_skills_score"] * 0.2
            + df["learning_goal_score"] * 0.15
            + df["career_path_score"] * 0.1
            + df["passing_year_score"] * 0.1
            + df["availability_score"] * 0.05
        )

        return df

    def search(self, query="", users=None, criteria=None):
        users = users or []
        criteria = criteria or {}
        query = self._normalize_identity(query)
        name_query = self._normalize_identity(self._criteria_value(criteria, "name"))
        email_query = self._normalize_email(self._criteria_value(criteria, "email"))

        if not users or (not query and not self._has_identity_criteria(name_query, email_query)):
            return []

        df = pd.DataFrame(users)
        if df.empty:
            return []

        if "_id" not in df.columns:
            df["_id"] = ""

        df["_id"] = df["_id"].fillna("").astype(str)
        df = df[df["_id"] != ""].drop_duplicates(subset=["_id"], keep="first")
        if df.empty:
            return []

        for col in ["name", "email", "branch", "career_path", "known_skills", "learning_goal", "availability"]:
            if col not in df.columns:
                df[col] = ""
            df[col] = df[col].apply(self._to_search_text).str.strip().str.lower()

        df["_normalized_name"] = df["name"].apply(self._normalize_identity)
        df["_normalized_email"] = df["email"].apply(self._normalize_email)
        df[["identity_rank", "identity_score"]] = df.apply(
            lambda row: self._identity_match(row, name_query, email_query),
            axis=1,
            result_type="expand",
        )

        if "passing_year" in df.columns:
            df["passing_year"] = df["passing_year"].astype(str).str.split("-").str[0]
            df["passing_year"] = pd.to_numeric(df["passing_year"], errors="coerce")
            median_year = df["passing_year"].median()
            df["passing_year"] = df["passing_year"].fillna(median_year if pd.notna(median_year) else 0)
        else:
            df["passing_year"] = 0

        df["combined_skills"] = (
            df["career_path"] + " " +
            df["known_skills"] + " " +
            df["learning_goal"]
        ).str.strip()

        df = self._add_similarity_scores(df, query)
        df["final_score"] = df[["final_score", "identity_score"]].max(axis=1)

        if self._has_identity_criteria(name_query, email_query) and not query:
            df = df[df["identity_rank"] > 0]

        if df.empty:
            return []

        df = df.sort_values(
            by=["identity_rank", "final_score", "name"],
            ascending=[False, False, True],
        )

        return df[["_id", "name", "final_score"]].head(10).to_dict(orient="records")
