import json
import re
import os
import math
from typing import List, Dict, Any, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Basic english stopwords list for resilient token cleaning
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", 
    "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", 
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", 
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", 
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", 
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", 
    "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", 
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", 
    "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", 
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", 
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", 
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", 
    "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", 
    "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", 
    "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
}

# Rule-based suffix lemmatizer
def lemmatize_word(word: str) -> str:
    word = word.lower()
    if len(word) <= 3:
        return word
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("ing") and len(word) > 5:
        return word[:-3]
    if word.endswith("ed") and len(word) > 4:
        return word[:-2]
    if word.endswith("es") and len(word) > 4:
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word

def preprocess_text(text: str) -> str:
    """NLP pipeline: lowercasing, punctuation stripping, tokenization, stopword removal, lemmatization."""
    if not text:
        return ""
    text = text.lower()
    # Strip punctuation and numbers
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
    cleaned_tokens = [lemmatize_word(tok) for tok in tokens if tok not in STOPWORDS and len(tok) > 1]
    return " ".join(cleaned_tokens)

# Fallback Intent Rules
INTENT_PATTERNS = {
    "refund": [r"\bmoney back\b", r"\brefund\b", r"\breturn money\b", r"\bget my money\b", r"\breimburse\b", r"\bpaisa wapas\b"],
    "return_policy": [r"\breturn\b", r"\breplace\b", r"\bexchange\b", r"\bdamaged item\b", r"\bbroken\b"],
    "order_tracking": [r"\btrack\b", r"\bshipment\b", r"\bwhere is my order\b", r"\bpackage\b", r"\bdelivery status\b", r"\bdispatch\b"],
    "shipping_times": [r"\bhow long to deliver\b", r"\bdelivery time\b", r"\bshipping time\b", r"\bdeliver\b", r"\bcarrier\b"],
    "password_reset": [r"\bforgot password\b", r"\breset password\b", r"\bchange password\b", r"\blost password\b"],
    "account_creation": [r"\bsign up\b", r"\bcreate account\b", r"\bregister\b", r"\bnew user\b"],
    "subscription_plans": [r"\bplan\b", r"\bpricing\b", r"\bpro\b", r"\bbusiness\b", r"\bcost\b", r"\bsubscription\b", r"\bfree plan\b"],
    "token_usage": [r"\btoken\b", r"\bquota\b", r"\bmeter\b", r"\bexhausted\b", r"\btop up\b", r"\bcredit\b"],
    "voice_assistant": [r"\bjarvix\b", r"\bvoice\b", r"\bmic\b", r"\bspeak\b", r"\btalk\b", r"\bbarge in\b", r"\blistening\b"],
    "support_hours": [r"\bsupport hours\b", r"\bworking hours\b", r"\bcontact human\b", r"\bopen hours\b", r"\bhelp desk\b"],
    "technical_architecture": [r"\balgorithm\b", r"\btf-idf\b", r"\bcosine similarity\b", r"\bnlp\b", r"\bhow querix works\b"]
}

class QuerixNLPEngine:
    def __init__(self, faqs_path: str):
        self.faqs_path = faqs_path
        self.faqs: List[Dict[str, Any]] = []
        self.corpus: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.confidence_threshold = 0.35
        self.load_and_fit()

    def load_and_fit(self, extra_faqs: Optional[List[Dict[str, Any]]] = None):
        """Loads FAQs from disk and extra in-memory FAQs, fits TF-IDF matrix."""
        if os.path.exists(self.faqs_path):
            with open(self.faqs_path, "r", encoding="utf-8") as f:
                self.faqs = json.load(f)
        else:
            self.faqs = []

        if extra_faqs:
            self.faqs.extend(extra_faqs)

        # Build corpus using question, answer snippet, keywords, and intent
        self.corpus = []
        for faq in self.faqs:
            q_clean = preprocess_text(faq.get("question", ""))
            kw_clean = preprocess_text(" ".join(faq.get("keywords", [])))
            intent_clean = preprocess_text(faq.get("intent", "").replace("_", " "))
            topic_clean = preprocess_text(faq.get("topic", ""))
            
            # Weighting: question repeated twice for higher significance
            doc = f"{q_clean} {q_clean} {kw_clean} {intent_clean} {topic_clean}"
            self.corpus.append(doc)

        if self.corpus:
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def detect_intent(self, query: str) -> Optional[str]:
        query_lower = query.lower()
        for intent, patterns in INTENT_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, query_lower):
                    return intent
        return None

    def match(self, query: str, topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """Matches a user query against FAQs. Returns confidence, answer, and recommendations."""
        if not self.faqs or not self.vectorizer or not query.strip():
            return {
                "matched": False,
                "confidence": 0.0,
                "message": "Please ask a question.",
                "suggested_questions": [],
                "contact_support": True
            }

        cleaned_query = preprocess_text(query)
        # Vectorize query
        query_vec = self.vectorizer.transform([cleaned_query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # Topic filter mask adjustment if provided
        filtered_indices = []
        for idx, faq in enumerate(self.faqs):
            if not topic_filter or topic_filter == "All" or faq.get("topic") == topic_filter:
                filtered_indices.append(idx)

        if not filtered_indices:
            filtered_indices = list(range(len(self.faqs)))

        # Get sorted ranking within allowed indices
        ranked = sorted(filtered_indices, key=lambda idx: similarities[idx], reverse=True)
        best_idx = ranked[0]
        best_score = float(similarities[best_idx])
        best_faq = self.faqs[best_idx]

        # Check intent fallback
        detected_intent = self.detect_intent(query)
        intent_boosted = False
        if detected_intent:
            # Check if any FAQ matches this intent
            intent_matches = [i for i in filtered_indices if self.faqs[i].get("intent") == detected_intent]
            if intent_matches:
                intent_idx = intent_matches[0]
                # If best_score is below threshold or intent match is reasonably close, boost intent match
                if best_score < self.confidence_threshold or similarities[intent_idx] > 0.15:
                    best_idx = intent_idx
                    best_faq = self.faqs[intent_idx]
                    best_score = max(best_score, 0.78)  # Confident intent boost
                    intent_boosted = True

        # Related questions (next 3 distinct questions)
        related_questions = []
        for idx in ranked:
            if idx != best_idx and len(related_questions) < 3:
                q = self.faqs[idx].get("question")
                if q not in related_questions:
                    related_questions.append({
                        "id": self.faqs[idx].get("id"),
                        "question": q,
                        "topic": self.faqs[idx].get("topic"),
                        "confidence": round(float(similarities[idx]) * 100, 1)
                    })

        # Check against confidence threshold (0.35)
        if best_score >= self.confidence_threshold:
            confidence_pct = round(best_score * 100, 1)
            return {
                "matched": True,
                "faq_id": best_faq.get("id"),
                "topic": best_faq.get("topic"),
                "matched_question": best_faq.get("question"),
                "answer": best_faq.get("answer"),
                "confidence": confidence_pct,
                "confidence_score": best_score,
                "intent": best_faq.get("intent"),
                "related_questions": related_questions,
                "contact_support": False
            }
        else:
            # Low confidence fallback
            top_3_suggestions = []
            for idx in ranked[:3]:
                top_3_suggestions.append({
                    "id": self.faqs[idx].get("id"),
                    "question": self.faqs[idx].get("question"),
                    "topic": self.faqs[idx].get("topic"),
                    "confidence": round(float(similarities[idx]) * 100, 1)
                })

            return {
                "matched": False,
                "confidence": round(best_score * 100, 1),
                "confidence_score": best_score,
                "message": "I'm not completely sure I understood that accurately. Did you mean one of these?",
                "suggested_questions": top_3_suggestions,
                "contact_support": True
            }

    @staticmethod
    def calculate_token_usage(query: str, answer: str, is_voice: bool = False) -> int:
        """Token calculation: 1 token per ~4 chars input + answer + fixed voice overhead."""
        base_tokens = math.ceil((len(query) + len(answer)) / 4.0)
        voice_overhead = 18 if is_voice else 0
        return max(5, base_tokens + voice_overhead)
