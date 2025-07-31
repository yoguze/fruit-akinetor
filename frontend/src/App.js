import React, { useState } from "react";
import "./App.css";
import QuestionForm from "./components/QuestionForm";
import ChatHistory from "./components/chathistory";
import AnswerForm from "./components/AnswerForm";

// 20個の果物（ランダムに1つ選ぶ）
const fruitList = [
  "りんご", "バナナ", "ぶどう", "みかん", "もも",
  "さくらんぼ", "スイカ", "メロン", "キウイ", "パイナップル",
  "レモン", "ライム", "マンゴー", "パパイヤ", "ブルーベリー",
  "いちご", "グレープフルーツ", "なし", "かき", "ざくろ"
];

function App() {
  const [gameStage, setGameStage] = useState("title"); // "title" | "playing" | "finished"
  const [chosenAnswer, setChosenAnswer] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);

  const startGame = () => {
    const randomFruit = fruitList[Math.floor(Math.random() * fruitList.length)];
    setChosenAnswer(randomFruit);
    setChatLog([]);
    setIsCorrect(null);
    setGameStage("playing");
  };

  const handleAskQuestion = async (question) => {
    // プロンプト送信：仮にバックエンドに送る場合
    const response = await fetch("https://fruit-akinetor.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer: chosenAnswer }) // フロントから答えも送信
    });
    const data = await response.json();
    setChatLog([...chatLog, { question, answer: data.answer }]);
  };

  const handleGuess = (guess) => {
    const correct = guess === chosenAnswer;
    setIsCorrect(correct);
    if (correct) {
      setGameStage("finished");
    } else {
      setChatLog([...chatLog, { question: `答えは「${guess}」ですか？`, answer: "いいえ" }]);
    }
  };

  const returnToTitle = () => {
    setGameStage("title");
    setChosenAnswer(null);
    setChatLog([]);
    setIsCorrect(null);
  };

  return (
    <div className="App">
      {gameStage === "title" && (
        <div className="title-screen">
          <h1>🍎 果物アキネーター</h1>
          <button onClick={startGame}>ゲーム開始！</button>
        </div>
      )}

      {gameStage === "playing" && (
        <>
          <h2>🎯 質問して果物を当てよう！</h2>
          <QuestionForm onSubmit={handleAskQuestion} />
          <ChatHistory chatLog={chatLog} />
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
