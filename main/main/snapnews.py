from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import numpy as np
import faiss
import os
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
import torch
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SnapNews Backend: Translation + Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)
# =========================
# Initialize FastAPI
# =========================

app = FastAPI(title="SnapNews Backend: Translation + Chat")

# =========================
# Setup Gemini + FAISS for /chat
# =========================

# Set Gemini API Key
os.environ["GOOGLE_API_KEY"] = "AIzaSyBzPn7Az1ywQK1NFOwmGH4YdbJX1FWX4d4" #change it into .env
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Load embedder and Gemini model
embedder = SentenceTransformer("all-MiniLM-L6-v2")
gemini_model = genai.GenerativeModel("models/gemini-1.5-flash")

# Dummy news corpus
documents = [
    "Heavy rains caused flooding in Kerala, affecting thousands.",
    "Kerala launched a dengue awareness program.",
    "An IT park was inaugurated in Kochi with job opportunities.",
    "Kerala passed a bill on solid waste management reform."
]
# FAISS index
doc_embeddings = embedder.encode(documents, convert_to_numpy=True)
dimension = doc_embeddings.shape[1]
faiss_index = faiss.IndexFlatL2(dimension)
faiss_index.add(doc_embeddings)

# =========================
# Setup M2M100 for /translate
# =========================

model_name = "facebook/m2m100-12B-last-ckpt"
tokenizer = M2M100Tokenizer.from_pretrained(model_name)
translation_model = M2M100ForConditionalGeneration.from_pretrained(model_name)

# =========================
# Request Schemas
# =========================

class ChatRequest(BaseModel):
    question: str
    top_k: int = 3

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

# =========================
# Chat Endpoint (/chat)
# =========================

@app.post("/chat")
def gemini_rag_chat(req: ChatRequest):
    try:
        q_embed = embedder.encode([req.question], convert_to_numpy=True)
        _, top_indices = faiss_index.search(q_embed, req.top_k)
        retrieved = [documents[i] for i in top_indices[0]]

        context = "\n".join(f"- {doc}" for doc in retrieved)
        prompt = (
            f"You are a news assistant. Use the following context to answer the user's question.\n\n"
            f"Context:\n{context}\n\nQuestion: {req.question}\nAnswer:"
        )

        response = gemini_model.generate_content(prompt)
        return {
            "question": req.question,
            "context": context,
            "answer": response.text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# Translation Endpoint (/translate)
# =========================

@app.post("/translate")
def translate(req: TranslationRequest):
    try:
        tokenizer.src_lang = req.source_lang
        encoded = tokenizer(req.text, return_tensors="pt")

        generated_tokens = translation_model.generate(
            **encoded,
            forced_bos_token_id=tokenizer.get_lang_id(req.target_lang)
        )

        translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        return {"translation": translated_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))