from flask import Flask, request, jsonify
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from transformers import pipeline
from flask_cors import CORS
import os
from langdetect import detect
import argostranslate.package
import argostranslate.translate

# Try to import web search (optional)
try:
    from duckduckgo_search import DDGS
    WEB_SEARCH_AVAILABLE = True
except ImportError:
    try:
        from ddgs import DDGS
        WEB_SEARCH_AVAILABLE = True
    except ImportError:
        WEB_SEARCH_AVAILABLE = False
        print("Web search not available. Install with: pip install duckduckgo-search")

app = Flask(__name__)
CORS(app)

# Initialize embedding model and QA model
model_embed = SentenceTransformer("all-MiniLM-L6-v2")
qa_model = pipeline("text2text-generation", model="google/flan-t5-base")

# Load Argos Translate models (make sure you’ve installed Hindi model)
installed_languages = argostranslate.translate.get_installed_languages()

def get_lang_code(text):
    try:
        return detect(text)
    except:
        return "en"

def translate(text, from_lang_code, to_lang_code):
    from_lang = next((lang for lang in installed_languages if lang.code == from_lang_code), None)
    to_lang = next((lang for lang in installed_languages if lang.code == to_lang_code), None)
    if from_lang and to_lang:
        translation = from_lang.get_translation(to_lang)
        return translation.translate(text)
    return text  # fallback if translation not available

def search_web(query, max_results=3):
    """Search the web for additional context using DuckDuckGo"""
    if not WEB_SEARCH_AVAILABLE:
        return ""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            web_context = []
            for r in results:
                web_context.append(f"{r.get('title', '')}: {r.get('body', '')}")
            return "\n".join(web_context)
    except Exception as e:
        print(f"Web search error: {e}")
        return ""

@app.route("/videos", methods=["GET"])
def list_videos():
    public_dir = os.path.join(os.path.dirname(__file__), "../frontend/public")
    video_extensions = (".mp4", ".webm", ".mov")
    videos = []
    for fname in os.listdir(public_dir):
        if fname.lower().endswith(video_extensions):
            videos.append({
                "title": os.path.splitext(fname)[0],
                "file": f"/{fname}",
                "thumbnail": f"/{fname}",
                "duration": "",
                "description": "Uploaded video"
            })
    return jsonify(videos)

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data["question"]
    video_title = data.get("video_title", "")

    # Load correct aligned_segments file
    aligned_path = f"aligned_segments_{video_title}.json"
    if not os.path.exists(aligned_path):    
        aligned_path = "aligned_segments.json"  # fallback
    with open(aligned_path, "r", encoding="utf-8") as f:
        segments = json.load(f)

    texts = [s['text'] for s in segments]
    embeddings = model_embed.encode(texts, convert_to_numpy=True)

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    # Detect user's language
    user_lang = get_lang_code(question)

    # Detect video's language from first 3 transcript segments (assume all same language)
    sample_text = " ".join(texts[:3])
    video_lang = get_lang_code(sample_text)

    # Embed and retrieve relevant segments (use original question - embeddings work across languages)
    query_vec = model_embed.encode([question])
    distances, indices = index.search(np.array(query_vec), 3)

    # Get the most relevant segments
    relevant_segments = [segments[i]["text"] for i in indices[0]]
    context = "\n".join(relevant_segments)
    
    # Try to translate context to English for LLM (Flan-T5 works best with English)
    context_for_llm = context
    translation_available = False
    
    if video_lang == "hi":
        translated_context = translate(context, "hi", "en")
        # Check if translation actually worked (not same as input)
        if translated_context != context and len(translated_context) > 20:
            context_for_llm = translated_context
            translation_available = True
    
    # Limit context length to avoid token overflow (max ~300 chars)
    context_for_llm = context_for_llm[:600]
    
    # Translate question to English for LLM if needed
    question_for_llm = question
    if user_lang == "hi":
        translated_q = translate(question, "hi", "en")
        if translated_q != question:
            question_for_llm = translated_q
    
    # Search web for additional context (limit results)
    web_context = search_web(question_for_llm, max_results=2)
    # Limit web context length
    web_context = web_context[:400] if web_context else ""
    
    # Generate answer with limited context to avoid token overflow
    prompt = f"""Answer the question using the video transcript and web info.

Video: {context_for_llm}

Web: {web_context if web_context else 'None'}

Question: {question_for_llm}

Answer in 2-3 sentences:"""
    
    response = qa_model(prompt, max_new_tokens=150)[0]["generated_text"]
    answer_in_english = response.strip()
    
    # Clean up the answer
    if "Answer:" in answer_in_english:
        answer_in_english = answer_in_english.split("Answer:")[-1].strip()
    if "sentences:" in answer_in_english:
        answer_in_english = answer_in_english.split("sentences:")[-1].strip()
    
    # Fallback: Create a structured answer if LLM answer is poor
    if not answer_in_english or len(answer_in_english) < 20:
        # Use the most relevant segment with web context
        best_segment = relevant_segments[0] if relevant_segments else context[:300]
        
        if web_context:
            # Combine video and web info in fallback
            fallback_prompt = f"Summarize this: {best_segment}. Additional info: {web_context[:200]}"
            fallback_response = qa_model(fallback_prompt, max_new_tokens=150)[0]["generated_text"]
            answer_in_english = fallback_response.strip() if fallback_response.strip() else f"From the video: {best_segment[:200]}"
        else:
            answer_in_english = f"From the video: {best_segment[:200]}"
    # Translate answer to user's language
    answer_in_user_lang = answer_in_english
    answer_in_video_lang = answer_in_english
    
    if user_lang == "hi" and answer_in_english:
        translated_ans = translate(answer_in_english, "en", "hi")
        if translated_ans != answer_in_english:
            answer_in_user_lang = translated_ans
    
    if video_lang == "hi" and answer_in_english:
        translated_ans = translate(answer_in_english, "en", "hi")
        if translated_ans != answer_in_english:
            answer_in_video_lang = translated_ans

    # Prepare results
    segment_results = [
        {
            "speaker": segments[i].get("speaker", "Unknown"),
            "start": segments[i]["start"],
            "end": segments[i]["end"],
            "text": segments[i]["text"]
        } for i in indices[0]
    ]

    return jsonify({
        "question_language": user_lang,
        "video_language": video_lang,
        "answer_translated": answer_in_user_lang,
        "answer_original": answer_in_video_lang,
        "segments": segment_results
    })

if __name__ == "__main__":
    app.run(debug=True)