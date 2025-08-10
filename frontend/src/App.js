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

  // 二重送信の防止用
  const [submittingAsk, setSubmittingAsk] = useState(false);
  const [submittingGuess, setSubmittingGuess] = useState(false);

  // タイトルに戻る（初期化）
  const returnToTitle = () => {
    setGameStage("start");
    setSessionId("");
    setChosenAnswer("");
    setChatHistory([]);
    setError("");
    setSubmittingAsk(false);
    setSubmittingGuess(false);
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

  // 質問送信（gameStageガード＋二重送信防止＋400ハンドリング）
  const handleAskQuestion = async (question) => {
    if (gameStage !== "playing" || !question.trim() || !sessionId || submittingAsk) return;
    setSubmittingAsk(true);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question }),
      });

      if (!res.ok) {
        // 400系の詳細をUIに出す
        if (res.status === 400) {
          const body = await res.json().catch(() => ({}));
          const msg = body?.error || "Bad Request";
          setError(`質問に失敗: ${msg}`);
          // セッション無効ならタイトルへ戻す
          if (msg.toLowerCase().includes("invalid session")) {
            setGameStage("start");
            setSessionId("");
          }
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: data.answer ?? "(no answer)" },
      ]);
    } catch (e) {
      console.error("❌ 質問送信エラー:", e);
      setError(`質問に失敗しました: ${String(e)}`);
    } finally {
      setSubmittingAsk(false);
    }
  };

  // 解答送信（gameStageガード＋二重送信防止＋400ハンドリング）
  const handleGuess = async (guess) => {
    if (gameStage !== "playing" || !guess.trim() || !sessionId || submittingGuess) return;
    setSubmittingGuess(true);
    try {
      const res = await fetch(`${API_BASE}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, guess }),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const body = await res.json().catch(() => ({}));
          const msg = body?.error || "Bad Request";
          setError(`解答に失敗: ${msg}`);
          if (msg.toLowerCase().includes("invalid session")) {
            setGameStage("start");
            setSessionId("");
          }
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.correct) {
        setChosenAnswer(guess);
        setGameStage("finished"); // 終了画面に遷移（正解時はアラートなし）
        return;
      }
      alert("❌ 残念、不正解です。");
    } catch (e) {
      console.error("❌ 解答送信エラー:", e);
      setError(`解答に失敗しました: ${String(e)}`);
    } finally {
      setSubmittingGuess(false);
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
          {/* 送信中の見た目（任意） */}
          {(submittingAsk || submittingGuess) && <p>送信中…</p>}
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

