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

    # Translate user question → video language
    question_translated = translate(question, user_lang, video_lang)

    # Embed and retrieve relevant segments
    query_vec = model_embed.encode([question_translated])
    distances, indices = index.search(np.array(query_vec), 3)

    context = "\n".join([segments[i]["text"] for i in indices[0]])
    prompt = f"Context: {context}\n\nQuestion: {question_translated}\nAnswer:"
    response = qa_model(prompt, max_new_tokens=100)[0]["generated_text"]
    answer_in_video_lang = response.split("Answer:")[-1].strip()

    # Translate back to user's language
    answer_in_user_lang = translate(answer_in_video_lang, video_lang, user_lang)

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
