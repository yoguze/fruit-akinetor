// src/components/chathistory.js
import React from "react";

function ChatHistory({ history }) {
  return (
    <div className="chat-history">
      <h2>💬 質問履歴</h2>
      {history.map((e, idx) => (
        <div key={idx} className={`chat-entry ${e.role}`}>
          {e.role === "user" ? (
            <>
              <strong>Q:</strong> {e.content}
            </>
          ) : (
            <>
              <strong>A:</strong> {e.content}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatHistory;

