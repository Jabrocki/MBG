from __future__ import annotations
import os
from .contracts import EmbeddingProvider, GenerativeProvider

class NomicEmbeddingProvider(EmbeddingProvider):
    model_name = "nomic-ai/nomic-embed-text-v1.5"
    dimensions = 512
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(self.model_name, trust_remote_code=True)
    def embed_documents(self, texts):
        return self.model.encode(["search_document: " + text for text in texts], normalize_embeddings=True).tolist()

class GeminiProvider(GenerativeProvider):
    def __init__(self, model: str = "gemini-2.5-flash-lite"):
        from google import genai
        key = os.environ.get("GEMINI_API_KEY")
        if not key: raise RuntimeError("Brak GEMINI_API_KEY")
        self.client, self.model = genai.Client(api_key=key), model
    def generate_json(self, prompt, schema):
        response = self.client.models.generate_content(model=self.model, contents=prompt, config={"response_mime_type":"application/json", "response_json_schema":schema})
        import json
        return json.loads(response.text)
