from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from openai import OpenAI
import os
from dotenv import load_dotenv

client = OpenAI()

# .envからAPIキーを読み込む
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 果物のリスト（20個）
fruit_list = [
    "りんご", "バナナ", "ぶどう", "みかん", "もも",
  "さくらんぼ", "スイカ", "メロン", "キウイ", "パイナップル",
  "レモン", "ライム", "マンゴー", "パパイヤ", "ブルーベリー",
  "いちご", "グレープフルーツ", "なし", "かき", "ざくろ"
]

# アプリ設定
app = Flask(__name__)
CORS(app)

# 正解の果物（セッション的に1つ固定で保持）
chosen_answer = random.choice(fruit_list)

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    print("✅ 受け取ったデータ:", data)
    question = data.get("question", "")
    answer = data.get("answer", "")

    # GPTに質問を与えてYes/No回答させる
    prompt = f"""
あなたは果物アキネーターAIです。
正解の果物は「{chosen_answer}」です。
以下の質問に「はい」または「いいえ」か「わからない」で正確に答えてください：

質問: {question}
答え：
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.choices[0].message.content
        return jsonify({"answer": answer})

    except Exception as e:
        print("❌ エラー発生:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/guess", methods=["POST"])
def guess():
    data = request.get_json()
    guess = data.get("guess", "").strip()
    correct = (guess == chosen_answer)
    return jsonify({"correct": correct})

@app.route("/", methods=["GET"])
def index():
    return "Backend is running!", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render用にPORT環境変数を取得
    app.run(host="0.0.0.0", port=port)
