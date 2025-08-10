import React, { useState } from "react";
import "./App.css";
import ChatHistory from "./chathistory";
import QuestionForm from "./QuestionForm";
import AnswerForm from "./AnswerForm";

function App() {
  const [sessionId, setSessionId] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [gameStage, setGameStage] = useState("start"); // start, playing, end

  // ゲーム開始
  const startGame = async () => {
    try {
      const res = await fetch("https://fruit-akinetor-engine.onrender.com/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        setChatHistory([]);
        setGameStage("playing");
        console.log("🎯 新しいセッションID:", data.sessionId);
      } else {
        console.error("❌ セッションIDが取得できません:", data);
      }
    } catch (err) {
      console.error("❌ ゲーム開始エラー:", err);
    }
  };

  // 質問送信
  const handleQuestionSubmit = async (question) => {
    if (!question.trim() || !sessionId) return;
    try {
      const res = await fetch("https://fruit-akinetor-engine.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question }),
      });
      const data = await res.json();
      if (data.answer) {
        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: question },
          { role: "assistant", content: data.answer },
        ]);
      } else {
        console.error("❌ 回答が取得できません:", data);
      }
    } catch (err) {
      console.error("❌ 質問送信エラー:", err);
    }
  };

  // 解答送信
  const handleAnswerSubmit = async (guess) => {
    if (!guess.trim() || !sessionId) return;
    try {
      const res = await fetch("https://fruit-akinetor-engine.onrender.com/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, guess }),
      });
      const data = await res.json();
      if (data.correct) {
        alert("🎉 正解です！");
      } else {
        alert("❌ 残念、不正解です。");
      }
      setGameStage("end");
    } catch (err) {
      console.error("❌ 解答送信エラー:", err);
    }
  };

  return (
    <div className="App">
      {gameStage === "start" && (
        <button onClick={startGame}>Start</button>
      )}

      {gameStage === "playing" && (
        <>
          <QuestionForm onSubmit={handleQuestionSubmit} />
          <ChatHistory history={chatHistory} />
          <AnswerForm onSubmit={handleAnswerSubmit} />
        </>
      )}

      {gameStage === "end" && (
        <>
          <p>ゲーム終了</p>
          <button onClick={startGame}>もう一度</button>
        </>
      )}
    </div>
  );
}

export default App;
