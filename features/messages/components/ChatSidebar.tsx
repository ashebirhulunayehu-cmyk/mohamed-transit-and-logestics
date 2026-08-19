'use client';
import React from 'react';
import { useMessageStore } from '../message.store';

export const ChatSidebar = () => {
  const { conversations, activeConversationId, setActiveConversation, filterTab, setFilterTab } = useMessageStore();

  const filteredConversations = conversations.filter((c) => {
    if (filterTab === "All") return true;
    if (filterTab === "Groups") return c.type === "Groups";
    if (filterTab === "Direct") return c.type === "Direct";
    return true;
  });

  return (
    <div className="w-96 border-r border-slate-200 bg-white flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-100">
        <input 
          type="text" 
          placeholder="Search conversations" 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex px-4 py-2 space-x-2 border-b border-slate-100">
        {(["All", "Groups", "Direct"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
              filterTab === tab ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
        {filteredConversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          return (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`p-4 cursor-pointer transition hover:bg-slate-50 ${isActive ? "bg-indigo-50/50 border-l-4 border-indigo-600" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{conv.title}</h4>
                <span className="text-[10px] text-slate-400">{conv.time}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{conv.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};