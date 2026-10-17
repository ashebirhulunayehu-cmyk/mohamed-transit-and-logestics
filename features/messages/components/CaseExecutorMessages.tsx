"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { useMessageStore } from "@/features/messages/message.store";

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

export default function CaseExecutorMessages() {
  const {
    conversations,
    activeConversationId,
    fetchConversations,
    setActiveConversation,
    sendMessage,
    loading,
    sending,
    error,
    clearError,
  } = useMessageStore();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadConversations = async () => {
      await fetchConversations();
      if (cancelled) return;

      const state = useMessageStore.getState();
      const selected = state.conversations.find(
        (item) => item.id === state.activeConversationId,
      );
      if (selected?.type === "Direct") {
        await state.setActiveConversation(selected.id);
      }
    };

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [fetchConversations]);

  const conversation = conversations.find(
    (item) => item.id === activeConversationId,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending || !conversation) return;

    await sendMessage(content);
    if (useMessageStore.getState().error) return;
    setDraft("");
    await fetchConversations();
    await setActiveConversation(
      useMessageStore.getState().activeConversationId,
    );
  };

  return (
    <section className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[400px] w-full max-w-[1400px] flex-col overflow-hidden border border-slate-200 bg-white shadow-sm sm:rounded-xl">
      <header className="flex min-h-[88px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900">
            {conversation?.title ?? "Messages"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {conversation
              ? `${conversation.participants.length} participants${conversation.serviceId ? ` · Service ${conversation.serviceId}` : ""}`
              : "Messages for your assigned cases"}
          </p>
        </div>
        {conversation && conversation.participants.length > 0 && (
          <div
            className="flex shrink-0 items-center -space-x-2"
            aria-label={`${conversation.participants.length} conversation participants`}
          >
            {conversation.participants.slice(0, 5).map((initials, index) => (
              <span
                key={`${initials}-${index}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-medium text-slate-700"
              >
                {initials}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="flex-1 space-y-6 overflow-y-auto bg-slate-50/70 px-5 py-6 sm:px-6"
        aria-live="polite"
      >
        {loading && !conversation ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading messages…
          </p>
        ) : error && !conversation ? (
          <div className="mx-auto max-w-lg py-8 text-center">
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void fetchConversations()}
              className="mt-3 text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
            >
              Try again
            </button>
          </div>
        ) : !conversation ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No conversations are available.
          </p>
        ) : loading && conversation.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading conversation…
          </p>
        ) : conversation.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No messages in this conversation yet.
          </p>
        ) : (
          conversation.messages.map((message) => (
            <article
              key={message.id}
              className="flex items-start gap-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-200 text-xs font-medium text-slate-700">
                {getInitials(message.senderName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {message.senderName}
                  </span>
                  {message.timestamp && <> · {message.timestamp}</>}
                </p>
                <p className="whitespace-pre-wrap break-words border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800">
                  {message.text}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      {conversation && error && (
        <p
          role="alert"
          className="border-t border-rose-100 bg-rose-50 px-5 py-2 text-sm text-rose-800 sm:px-6"
        >
          {error}
        </p>
      )}
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6"
      >
        <button
          type="button"
          disabled
          aria-label="Attachments are not available"
          title="Attachments are not available"
          className="shrink-0 text-slate-400"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <label className="sr-only" htmlFor="case-executor-message">
          Message
        </label>
        <input
          id="case-executor-message"
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            clearError();
          }}
          placeholder="Write a message…"
          disabled={!conversation || sending}
          className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={!conversation || !draft.trim() || sending}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
        >
          <Send className="h-4 w-4" />
          <span>{sending ? "Sending…" : "Send"}</span>
        </button>
      </form>
    </section>
  );
}
