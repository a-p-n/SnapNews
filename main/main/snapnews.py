from fastapi import FastAPI, HTTPException, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import numpy as np
import faiss
import os
import torch
import time
import feedparser
import requests
from langdetect import detect
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer, PegasusTokenizer, PegasusForConditionalGeneration
from pymongo import MongoClient
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import threading
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
import torch
import faiss
from fastapi import HTTPException




model_dir = r"C:\Users\navee\Downloads" 
tokenizer = AutoTokenizer.from_pretrained(model_dir)
base_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")
model = PeftModel.from_pretrained(base_model, model_dir)
model.eval()
# === Load tokenizer and model once during app startup ===

scraper_lock = threading.Lock()
load_dotenv()
app = FastAPI(title="SnapNews Backend: Chat + Translation + Summarization + Auth")

# Serve static files
app.mount("/static", StaticFiles(directory="public"), name="static")

@app.get("/")
def serve_home():
    return FileResponse("public/home.html")

@app.get("/chatbot")
def serve_chatbot():
    return FileResponse("public/chatbot.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

os.environ["GOOGLE_API_KEY"] = os.getenv("API_KEY")
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

client = MongoClient("mongodb://localhost:27017/")
db = client["snapnews_db"]
collection = db["articles"]
auth_db = client["snapnews_auth"]
users_collection = auth_db["users"]

# === Load Models ===
embedder = SentenceTransformer("all-MiniLM-L6-v2")
gemini_model = genai.GenerativeModel("models/gemini-1.5-flash")

translation_tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
translation_model = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")

pegasus_tokenizer = PegasusTokenizer.from_pretrained("google/pegasus-xsum")
pegasus_model = PegasusForConditionalGeneration.from_pretrained("google/pegasus-xsum")

# === Schemas ===
class ChatRequest(BaseModel):
    question: str
    top_k: int = 10

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    fullName: str
    email: str
    username: str
    password: str

def summarize_with_pegasus_and_classify(text: str):
    inputs = pegasus_tokenizer(text, truncation=True, padding='longest', return_tensors="pt")
    summary_ids = pegasus_model.generate(
        inputs["input_ids"], 
        max_length=60, 
        min_length=15, 
        length_penalty=2.0
    )
    summary = pegasus_tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # Step 2: Classify domain with Gemini
    prompt = (
        "Classify the following news summary into one domain category. "
        "Valid domains are: Politics, Technology, Health, Sports, Business, Education, Entertainment, Environment, Conflict, International, Crime, or Other.\n\n"
        f"Summary: {summary}\n\n"
        "Domain:"
    )
    try:
        response = gemini_model.generate_content(prompt)
        domain = response.text.strip().title()
    except Exception as e:
        print(f"Gemini domain classification failed: {e}")
        domain = "Other"

    return summary, domain



# === News Scraper Job ===
def fetch_and_store_articles():
    if not scraper_lock.acquire(blocking=False):
        print("Scraper already running. Skipping this run.")
        return
    try:
        print("Scraping news...")
        RSS_FEEDS = {
            "BBC": "https://feeds.bbci.co.uk/hindi/rss.xml",
            "Hindu": "https://www.thehindu.com/news/national/?service=rss"
        }
        articles = []
        for source, feed_url in RSS_FEEDS.items():
            parsed = feedparser.parse(feed_url)
            for entry in parsed.entries:
                try:
                    ts = time.strftime("%Y-%m-%d %H:%M:%S", entry.published_parsed)
                except:
                    continue
                articles.append((source, entry, ts))

        articles.sort(key=lambda x: x[2], reverse=True)

        for i, (source, entry, ts) in enumerate(articles):
            if collection.find_one({"Title": entry.title,"Link": entry.link}):
                continue
            title = entry.title
            summary_text = entry.get("summary", "")
            lang = detect(title) if title else "en"

            if lang != "en":
                try:
                    translation_req = TranslationRequest(text=title, source_lang=lang, target_lang="en")
                    title = translate(translation_req)["translation"]

                    translation_req_summary = TranslationRequest(text=summary_text, source_lang=lang, target_lang="en")
                    summary_text = translate(translation_req_summary)["translation"]
                except Exception as e:
                    print(f"Translation failed: {e}")
                    continue

            try:
                final_summary, domain = summarize_with_pegasus_and_classify(summary_text)
            except:
                final_summary = summary_text

            document = {
                "Index": i,
                "Title": title,
                "Link": entry.link,
                "Source": source,
                "Timestamp": ts,
                "Language": lang,
                "Summary": final_summary,
                "Domain": domain
            }

            collection.insert_one(document)
            print(title)

        print("Scraping complete.")
    finally:
        scraper_lock.release()

@app.on_event("startup")
async def initial_run():
    import threading
    threading.Thread(target=fetch_and_store_articles,daemon=True).start()

@app.get("/update_news")
def update_news(background_tasks: BackgroundTasks):
    background_tasks.add_task(fetch_and_store_articles)
    return {"status": "News scraping scheduled in background."}

@app.post("/chat")
def flant5_rag_chat(req: ChatRequest):
    try:
        cursor = collection.find({"Summary": {"$exists": True}}, {"Summary": 1, "_id": 0})
        docs = [doc["Summary"] for doc in cursor if doc["Summary"].strip()]
        if not docs:
            raise HTTPException(status_code=404, detail="No summaries available")

        # Embed documents
        doc_embeddings = embedder.encode(docs, convert_to_numpy=True)
        dimension = doc_embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(doc_embeddings)

        # Embed the question
        q_embed = embedder.encode([req.question], convert_to_numpy=True)
        _, top_indices = index.search(q_embed, req.top_k)
        context = "\n".join(f"- {docs[i]}" for i in top_indices[0])

        # Construct input prompt
        prompt = (
    f"You are a helpful news assistant. You must answer the user's question based ONLY on the context below. "
    f"If the context is insufficient or unrelated, respond with:\n"
    f"\"I am a news assistant and I am unable to process any queries not related to my defined scope. "
    f"Please ask relevant questions.\"\n\n"
    f"Context:\n{context}\n\n"
    f"Question: {req.question}\n\n"
    f"Answer:"
)

        # Generate answer with FLAN-T5
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=150,
                do_sample=False,
                num_beams=4
            )

        answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"question": req.question, "context": context, "answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
def translate(req: TranslationRequest):
    try:
        translation_tokenizer.src_lang = req.source_lang
        encoded = translation_tokenizer(req.text, return_tensors="pt")

        generated_tokens = translation_model.generate(
            **encoded,
            forced_bos_token_id=translation_tokenizer.get_lang_id(req.target_lang)
        )

        translated_text = translation_tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        return {"translation": translated_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Query

from typing import Optional
from fastapi import Query

@app.get("/news")
def get_news(username: Optional[str] = Query(None, description="Username to filter news based on user topics")):
    try:
        if not username:
            return list(collection.find({}, {"_id": 0}).sort("Timestamp", -1).limit(20))

        user = users_collection.find_one({"username": username}, {"topics": 1})

        if not user or "topics" not in user or not user["topics"]:
            return list(collection.find({}, {"_id": 0}).sort("Timestamp", -1).limit(20))

        topics = [t.title() for t in user["topics"]] 

        query = {"Domain": {"$in": topics}}

        news = list(collection.find(query, {"_id": 0}).sort("Timestamp", -1).limit(20))

        if not news:
            news = list(collection.find({}, {"_id": 0}).sort("Timestamp", -1).limit(10))

        return news

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class Interest(BaseModel):
    topic: str
    username: str
@app.get("/auth/user")
def get_user(username: str):
    user = users_collection.find_one({"username": username}, {"_id": 0, "topics": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
@app.post("/auth/interests")
async def save_interest(interest: Interest):
    result = users_collection.update_one(
        {"username": interest.username},
        {"$addToSet": {"topics": interest.topic}}  # add only if not present
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"Interest '{interest.topic}' saved for {interest.username}"}
@app.get("/auth/interests/{username}")
async def get_interests(username: str):
    user = users_collection.find_one({"username": username}, {"_id": 0, "topics": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"topics": user.get("topics", [])}


@app.delete("/auth/interests")
async def remove_interest(interest : Interest):
    result = users_collection.update_one(
        {"username": interest.username},
        {"$pull": {"topics": interest.topic}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"Interest '{interest.topic}' removed for {interest.username}"}
# === Login + Signup Proxies ===
# @app.post("/login")
# def login_user(req: LoginRequest):
#     try:
#         response = requests.post("http://localhost:8000/auth/login", json=req.dict())
#         return response.json()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/signup")
# def signup_user(req: SignupRequest):
#     try:
#         response = requests.post("http://localhost:8000/auth/signup", json=req.dict())
#         return response.json()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
