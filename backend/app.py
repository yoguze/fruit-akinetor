from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import openai
import os
from dotenv import load_dotenv

# .envからAPIキーを読み込む
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 果物のリスト（25個）
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
    question = data.get("question", "")

    # GPTに質問を与えてYes/No回答させる
    prompt = f"""
あなたは果物アキネーターAIです。
正解の果物は「{chosen_answer}」です。
以下の質問に「はい」または「いいえ」で正確に答えてください：

質問: {question}
答え：
"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response["choices"][0]["message"]["content"].strip()
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/guess", methods=["POST"])
def guess():
    data = request.get_json()
    guess = data.get("guess", "").strip()
    correct = (guess == chosen_answer)
    return jsonify({"correct": correct})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

