import React, { useState } from "react";

function QuestionForm({ onSubmit }) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    onSubmit(question);
    setQuestion("");
  };

  return (
    <form onSubmit={handleSubmit} className="question-form">
      <input
        type="text"
        placeholder="質問を入力（例：赤いですか？）"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button type="submit">質問する</button>
    </form>
  );
}

export default QuestionForm;
