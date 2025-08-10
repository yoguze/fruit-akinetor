# app.py （完全版）
from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from openai import OpenAI
import os
from dotenv import load_dotenv
import uuid
import logging

# --------------------
# 基本設定
# --------------------
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # 必要なら環境変数で変更可
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
if not FRONTEND_ORIGIN:
    raise RuntimeError("FRONTEND_ORIGIN is not set in environment variables.")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY が未設定です。Render の Environment に追加してください。")

client = OpenAI(api_key=OPENAI_API_KEY)

app = Flask(__name__)
app.logger.setLevel(logging.INFO)

# 本番フロントとローカル開発を許可
ALLOWED_ORIGINS = {
    FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}

# Flask-CORS を厳密設定
CORS(
    app,
    resources={r"/*": {"origins": list(ALLOWED_ORIGINS)}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=False,
)

# どのレスポンスでもCORSヘッダが付くよう保険で付与
@app.after_request
def add_cors_headers(resp):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp

# 無料インスタンス起動直後の preflight 対策（明示的に 204 返す）
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        return ("", 204)

# --------------------
# ゲーム状態
# --------------------
sessions = {}  # session_id -> chosen fruit

fruit_list = [
    "りんご", "バナナ", "ぶどう", "みかん", "もも",
    "さくらんぼ", "スイカ", "メロン", "キウイ", "パイナップル",
    "レモン", "ライム", "マンゴー", "パパイヤ", "ブルーベリー",
    "いちご", "グレープフルーツ", "なし", "かき", "ざくろ",
]

# --------------------
# ルーティング
# --------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True}), 200

@app.route("/start", methods=["POST", "OPTIONS"])
def start():
    session_id = str(uuid.uuid4())
    chosen = random.choice(fruit_list)
    sessions[session_id] = chosen
    app.logger.info(f"🎯 start: session={session_id}  answer={chosen}")
    return jsonify({"sessionId": session_id})

@app.route("/ask", methods=["POST", "OPTIONS"])
def ask():
    try:
        data = request.get_json(force=True, silent=False) or {}
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    session_id = (data.get("sessionId") or "").strip()
    question = (data.get("question") or "").strip()
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    if not question:
        return jsonify({"error": "Question is empty"}), 400

    fruit = sessions[session_id]

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": f"あなたは果物のアキネーター。対象は「{fruit}」。必ず『はい』か『いいえ』のみで答える。",
                },
                {"role": "user", "content": question},
            ],
        )
        answer = (resp.choices[0].message.content or "").strip()
        # 念のため不正回答を丸める
        if "はい" in answer and "いいえ" in answer:
            answer = "わからない"
        elif "はい" not in answer and "いいえ" not in answer:
            # 期待形でない場合は保険で「わからない」に寄せる
            answer = "わからない"
        return jsonify({"answer": answer})
    except Exception as e:
        app.logger.error(f"❌ /ask error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/guess", methods=["POST", "OPTIONS"])
def guess():
    try:
        data = request.get_json(force=True, silent=False) or {}
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    session_id = (data.get("sessionId") or "").strip()
    guess_text = (data.get("guess") or "").strip()

    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400
    if not guess_text:
        return jsonify({"error": "Guess is empty"}), 400

    correct = (guess_text == sessions[session_id])
    # ゲーム終了：セッション破棄
    try:
        del sessions[session_id]
    except KeyError:
        pass

    return jsonify({"correct": correct})

@app.route("/", methods=["GET"])
def index():
    return "Backend is running!", 200

# --------------------
# エントリポイント
# --------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
