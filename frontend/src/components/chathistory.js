import React from "react";

function chathistory({ chatLog }) {
  return (
    <div className="chat-history">
      <h2>💬 質問履歴</h2>
      {chatLog.map((entry, idx) => (
        <div key={idx} className="chat-entry">
          <strong>Q:</strong> {entry.question} <br />
          <strong>A:</strong> {entry.answer}
        </div>
      ))}
    </div>
  );
}

export default chathistory;
