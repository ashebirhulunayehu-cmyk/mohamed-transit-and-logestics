'use client';
import React, { useState } from 'react';
import { useMessageStore } from '../message.store';

export const ChatWindow = () => {
  const { conversations, activeConversationId, sendMessage } = useMessageStore();
  const [inputText, setInputText] = useState("");

  const activeChat = conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{activeChat.title}</h2>
          <p className="text-xs text-slate-500">{activeChat.participants.length} participants · Active thread</p>
        </div>
        <div className="flex space-x-1">
          {activeChat.participants.map((p, idx) => (
            <span key={idx} className="w-7 h-7 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full flex items-center justify-center">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
        {activeChat.messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">{msg.senderName}</span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
            </div>
            
            <div className={`p-4 rounded-2xl max-w-lg text-sm shadow-sm ${
              msg.isMe 
                ? "bg-indigo-600 text-white rounded-br-none" 
                : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
            }`}>
              <p>{msg.text}</p>

              {msg.attachment && (
                <div className={`mt-3 p-2.5 rounded-xl flex items-center justify-between text-xs ${
                  msg.isMe ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                  <span>📎 {msg.attachment.name}</span>
                  <span className="opacity-75">{msg.attachment.size}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
        <button type="button" className="text-slate-400 hover:text-slate-600">
          📎
        </button>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write a message..." 
          className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
          Send
        </button>
      </form>
    </div>
  );
};