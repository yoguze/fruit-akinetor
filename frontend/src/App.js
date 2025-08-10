import React, { useState } from "react";
import "./App.css";
import ChatHistory from "./components/chathistory";
import QuestionForm from "./components/QuestionForm";
import AnswerForm from "./components/AnswerForm";

// 本番とローカルで API のベースURLを自動切替（必要なら環境変数で上書き）
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (typeof window !== "undefined" &&
  window.location.hostname.endsWith("onrender.com")
    ? "https://fruit-akinetor-engine.onrender.com" // ←あなたのbackend URLに合わせて
    : "http://localhost:5000");

function App() {
  const [sessionId, setSessionId] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // [{role:'user'|'assistant', content:string}]
  const [gameStage, setGameStage] = useState("start"); // "start" | "playing" | "finished"
  const [chosenAnswer, setChosenAnswer] = useState(""); // 終了画面表示用
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // タイトルに戻る（初期化）
  const returnToTitle = () => {
    setGameStage("start");
    setSessionId("");
    setChosenAnswer("");
    setChatHistory([]);
    setError("");
  };

  // ゲーム開始（セッション作成）
  const startGame = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.sessionId) throw new Error("sessionId が取得できません");
      setSessionId(data.sessionId);
      setChatHistory([]);
      setChosenAnswer("");
      setGameStage("playing");
      console.log("🎯 新しいセッションID:", data.sessionId);
    } catch (e) {
      console.error("❌ ゲーム開始エラー:", e);
      setError(`ゲーム開始に失敗しました: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // 質問送信
  const handleAskQuestion = async (question) => {
    if (!question.trim() || !sessionId) return;
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: data.answer ?? "(no answer)" },
      ]);
    } catch (e) {
      console.error("❌ 質問送信エラー:", e);
      setError(`質問に失敗しました: ${String(e)}`);
    }
  };

  // 解答送信（正解→終了画面へ。不正解のみ alert）
  const handleGuess = async (guess) => {
    if (!guess.trim() || !sessionId) return;
    try {
      const res = await fetch(`${API_BASE}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, guess }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.correct) {
        setChosenAnswer(guess);
        setGameStage("finished"); // 終了画面に遷移
        return;
      }
      alert("❌ 残念、不正解です。");
    } catch (e) {
      console.error("❌ 解答送信エラー:", e);
      setError(`解答に失敗しました: ${String(e)}`);
    }
  };

  return (
    <div className="App">
      <h1>🍎 果物アキネーター</h1>

      {error && <p className="wrong">{error}</p>}
      {loading && (
        <p>起動中…（Renderの無料インスタンスは初回に数十秒かかることがあります）</p>
      )}

      {gameStage === "start" && (
        <div style={{ textAlign: "center" }}>
          <p>はい / いいえ で果物を当てよう！</p>
          <button onClick={startGame}>Start</button>
        </div>
      )}

      {gameStage === "playing" && (
        <>
          <h2>🎯 質問して果物を当てよう！</h2>
          <QuestionForm onSubmit={handleAskQuestion} />
          <ChatHistory history={chatHistory} />
          <AnswerForm onSubmit={handleGuess} />
        </>
      )}

      {gameStage === "finished" && (
        <div className="finish-screen">
          <h2>🎉 正解！答えは「{chosenAnswer}」でした！</h2>
          <button onClick={returnToTitle}>タイトルに戻る</button>
        </div>
      )}
    </div>
  );
}

export default App;
