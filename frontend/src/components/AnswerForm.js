import React, { useState } from "react";

function AnswerForm({ onSubmit }) {
  const [guess, setGuess] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    onSubmit(guess);
    setGuess("");
  };

  return (
    <form onSubmit={handleSubmit} className="answer-form">
      <input
        type="text"
        placeholder="あなたの答えは？（例：バナナ）"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
      />
      <button type="submit">解答する</button>
    </form>
  );
}

export default AnswerForm;
