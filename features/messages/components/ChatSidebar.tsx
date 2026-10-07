'use client';
import React, { useEffect } from 'react';
import { useMessageStore } from '../message.store';

export const ChatSidebar = () => {
  const {
    conversations,
    activeConversationId,
    isMobileChatOpen,
    setActiveConversation,
    filterTab,
    setFilterTab,
    fetchConversations,
    searchQuery,
    setSearchQuery,
    loading,
    error,
  } = useMessageStore();

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (filterTab === "All") return true;
    if (filterTab === "Groups") return c.type === "Groups";
    if (filterTab === "Direct") return c.type === "Direct";
    return true;
  });

  return (
    <div className={`flex h-full min-w-0 w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96 ${isMobileChatOpen ? 'hidden' : 'flex'} md:flex`}>
      {/* Search Bar */}
      <div className="border-b border-slate-100 p-4">
        <input 
          type="text" 
          placeholder="Search conversations" 
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex px-4 py-2 space-x-2 border-b border-slate-100">
        {(["All", "Groups", "Direct"] as const).map((tab) => (
          <button
            type="button"
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

      {loading && (
        <div className="px-4 py-3 text-xs text-slate-500">Loading conversations...</div>
      )}
      {error && !activeConversationId && (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Conversations List */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
        {filteredConversations.length === 0 && !loading ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            {conversations.length === 0 ? "No conversations found." : "No matching conversations."}
          </p>
        ) : filteredConversations.map((conv) => {
          const isActive = conv.id === activeConversationId;
          return (
            <button
              type="button"
              key={conv.id}
              onClick={() => void setActiveConversation(conv.id)}
              className={`block w-full p-4 text-left transition hover:bg-slate-50 ${isActive ? "border-l-4 border-indigo-600 bg-indigo-50/50" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{conv.title}</h4>
                <span className="text-[10px] text-slate-400">{conv.time}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{conv.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};