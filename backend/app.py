from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from openai import OpenAI
import os
from dotenv import load_dotenv
import uuid

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)
CORS(app)

# ゲームセッション保持用
sessions = {}

fruit_list = [
    "りんご", "バナナ", "ぶどう", "みかん", "もも",
    "さくらんぼ", "スイカ", "メロン", "キウイ", "パイナップル",
    "レモン", "ライム", "マンゴー", "パパイヤ", "ブルーベリー",
    "いちご", "グレープフルーツ", "なし", "かき", "ざくろ"
]

@app.route("/start", methods=["POST"])
def start():
    session_id = str(uuid.uuid4())
    chosen = random.choice(fruit_list)
    sessions[session_id] = chosen
    print(f"🎯 新しいゲーム開始: {session_id} → {chosen}")
    return jsonify({"sessionId": session_id})

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    session_id = data.get("sessionId")
    question = data.get("question", "")

    if session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400

    fruit = sessions[session_id]
    prompt = f"""
あなたは果物に関するアキネーターです。
対象の果物は「{fruit}」です。
ユーザーからの質問「{question}」に対して、
必ず「はい」または「いいえ」のみで答えてください。
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # 精度重視ならここを変更
            temperature=0,
            messages=[
                {"role": "system", "content": "あなたは果物のアキネーター。必ず『はい』か『いいえ』のみで回答。"},
                {"role": "user", "content": prompt}
            ]
        )
        answer = response.choices[0].message.content.strip()
        return jsonify({"answer": answer})

    except Exception as e:
        print("❌ エラー:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/guess", methods=["POST"])
def guess():
    data = request.get_json()
    session_id = data.get("sessionId")
    guess = data.get("guess", "").strip()

    if session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400

    correct = (guess == sessions[session_id])
    return jsonify({"correct": correct})

@app.route("/", methods=["GET"])
def index():
    return "Backend is running!", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

