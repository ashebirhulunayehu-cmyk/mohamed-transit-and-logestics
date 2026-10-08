'use client';
import React, { useState, type FormEvent } from 'react';
import { ArrowLeft, Info, Paperclip, Send, X } from 'lucide-react';
import { useMessageStore } from '../message.store';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useMessagingStore } from '@/modules/message/message.store';

const readUserName = (user: { firstName?: string | null; lastName?: string | null; username?: string | null; email?: string | null } | null | undefined): string =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || user?.email || 'Unknown user';

export const ChatWindow = () => {
  const {
    conversations,
    activeConversationId,
    isMobileChatOpen,
    closeMobileChat,
    sendMessage,
    loading,
    sending,
    error,
    clearError,
  } = useMessageStore();
  const selectedMessage = useMessagingStore((state) => state.selectedMessage);
  const fetchMessageById = useMessagingStore((state) => state.fetchMessageById);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [inputText, setInputText] = useState("");
  const [messageIdQuery, setMessageIdQuery] = useState("");
  const [detailsMessageId, setDetailsMessageId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [composeServiceId, setComposeServiceId] = useState("");
  const [composeRecipientId, setComposeRecipientId] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeStatus, setComposeStatus] = useState<string | null>(null);
  const [composeSending, setComposeSending] = useState(false);

  const activeChat = conversations.find((conversation) => conversation.id === activeConversationId);
  const detailMessage = selectedMessage && String(selectedMessage.id) === detailsMessageId
    ? selectedMessage
    : null;

  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    await sendMessage(inputText);
    if (!useMessageStore.getState().error) setInputText("");
  };

  const handleNewMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const serviceId = Number(composeServiceId);
    const receiverId = Number(composeRecipientId);
    if (!Number.isSafeInteger(serviceId) || serviceId <= 0 || !Number.isSafeInteger(receiverId) || receiverId <= 0) {
      setComposeError("Enter valid positive Service ID and Recipient ID values.");
      return;
    }
    if (currentUserId !== undefined && String(receiverId) === String(currentUserId)) {
      setComposeError("Choose another recipient. You cannot send a message to your own account.");
      return;
    }
    if (!inputText.trim()) {
      setComposeError("Write a message before sending.");
      return;
    }
    if (!composeSubject.trim()) {
      setComposeError("Enter a subject before sending.");
      return;
    }

    setComposeError(null);
    setComposeStatus(null);
    setComposeSending(true);
    const result = await useMessagingStore.getState().sendMessage({
      serviceId,
      recipientUserId: receiverId,
      content: inputText.trim(),
      subject: composeSubject.trim(),
    });
    const sendError = useMessagingStore.getState().error;
    setComposeSending(false);
    if (!result) {
      setComposeError(sendError ?? "Message could not be sent.");
      return;
    }

    setComposeStatus(result.message || "Message sent successfully.");
    setInputText("");
    setComposeSubject("");
    await useMessageStore.getState().fetchConversations();
  };

  const openMessageDetails = async (messageId: string) => {
    setDetailsMessageId(messageId);
    setDetailsLoading(true);
    setDetailsError(null);
    const message = await fetchMessageById(messageId);
    setDetailsLoading(false);
    if (!message) {
      setDetailsError(useMessagingStore.getState().error ?? "Unable to load message details.");
    }
  };

  const handleMessageLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const messageId = messageIdQuery.trim();
    if (!/^\d+$/.test(messageId)) {
      setDetailsMessageId(messageId || "lookup");
      setDetailsLoading(false);
      setDetailsError("Enter a numeric message ID.");
      return;
    }
    await openMessageDetails(messageId);
  };

  return (
    <div className={`h-full min-w-0 flex-1 flex-col bg-white ${isMobileChatOpen ? 'flex' : 'hidden'} md:flex`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <button
            type="button"
            onClick={closeMobileChat}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Conversations
          </button>
          <h2 className="text-sm font-bold text-slate-900">
            {activeChat?.title ?? "Select a conversation"}
          </h2>
          <p className="text-xs text-slate-500">
            {activeChat ? `${activeChat.participants.length} participants · Active thread` : "Choose a conversation to view messages."}
          </p>
        </div>
        <div className="flex space-x-1">
          {activeChat?.participants.map((p, idx) => (
            <span key={idx} className="w-7 h-7 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full flex items-center justify-center">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/30 p-6">
        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading messages...</p>
        ) : !activeChat ? (
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">New message</h3>
              <p className="mt-1 text-xs text-slate-500">Enter a service and recipient to start a conversation.</p>
              <form onSubmit={(event) => void handleNewMessage(event)} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-slate-700">Service ID
                    <input type="number" min="1" step="1" required value={composeServiceId} onChange={(event) => setComposeServiceId(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">Recipient ID
                    <input type="number" min="1" step="1" required value={composeRecipientId} onChange={(event) => setComposeRecipientId(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  </label>
                </div>
                <label className="block text-xs font-medium text-slate-700">Subject
                  <input required value={composeSubject} onChange={(event) => { setComposeSubject(event.target.value); setComposeError(null); }} placeholder="Message subject" className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <label className="block text-xs font-medium text-slate-700">Message
                  <textarea required rows={3} value={inputText} onChange={(event) => { setInputText(event.target.value); setComposeError(null); }} placeholder="Write a message..." className="mt-1.5 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </label>
                {composeError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{composeError}</p>}
                {composeStatus && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{composeStatus}</p>}
                <div className="flex justify-end">
                  <button type="submit" disabled={composeSending || !inputText.trim()} className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Send className="h-4 w-4" />{composeSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </section>
            <form onSubmit={(event) => void handleMessageLookup(event)} className="flex w-full gap-2">
              <label className="sr-only" htmlFor="message-id-lookup">Message ID</label>
              <input id="message-id-lookup" inputMode="numeric" value={messageIdQuery} onChange={(event) => setMessageIdQuery(event.target.value)} placeholder="Look up message by ID" className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <button type="submit" disabled={!messageIdQuery.trim() || detailsLoading} className="h-10 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{detailsLoading ? "Loading" : "Find message"}</button>
            </form>
          </div>
        ) : activeChat.messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">No messages in this conversation yet.</p>
        ) : activeChat.messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">{msg.senderName}</span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              <button type="button" onClick={() => void openMessageDetails(msg.id)} title="View message details" aria-label={`View details for message from ${msg.senderName}`} className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <Info className="h-3.5 w-3.5" />
              </button>
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
      {activeChat && error && (
        <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-800">
          {error}
        </p>
      )}
      {activeChat && <form onSubmit={(event) => void handleSend(event)} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
        <button type="button" disabled className="text-slate-400" aria-label="Attachments are not available">
          <Paperclip className="h-4 w-4" />
        </button>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            clearError();
          }}
          placeholder="Write a message..." 
          disabled={!activeChat || sending}
          className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button type="submit" disabled={!activeChat || !inputText.trim() || sending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Send className="h-4 w-4" />
          {sending ? "Sending..." : "Send"}
        </button>
      </form>}

      {detailsMessageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="message-details-title" className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <h3 id="message-details-title" className="text-sm font-semibold text-slate-900">Message details</h3>
                <p className="mt-1 text-xs text-slate-500">Message ID {detailsMessageId}</p>
              </div>
              <button type="button" onClick={() => { setDetailsMessageId(null); setDetailsError(null); }} aria-label="Close message details" className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </header>
            <div className="space-y-3 p-4">
              {detailsLoading ? <p className="text-sm text-slate-500">Loading message details...</p> : detailsError ? <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{detailsError}</p> : detailMessage ? (
                <>
                  <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
                    <dt className="text-slate-500">From</dt><dd className="text-slate-800">{readUserName(detailMessage.senderUser)}</dd>
                    <dt className="text-slate-500">To</dt><dd className="text-slate-800">{readUserName(detailMessage.recipientUser)}</dd>
                    <dt className="text-slate-500">Service</dt><dd className="text-slate-800">{detailMessage.service?.trackingNumber ?? detailMessage.serviceId ?? "—"}</dd>
                    <dt className="text-slate-500">Sent</dt><dd className="text-slate-800">{detailMessage.createdDate ?? detailMessage.createAt ?? "—"}</dd>
                  </dl>
                  <div className="border-t border-slate-100 pt-3"><p className="text-xs font-medium text-slate-500">Message</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{detailMessage.content ?? detailMessage.subject ?? "—"}</p></div>
                </>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};