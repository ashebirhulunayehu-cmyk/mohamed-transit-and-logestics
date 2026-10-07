'use client';

import { Paperclip, Search, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type ChatThread = {
  id: string;
  title: string;
  serviceId: number;
  receiverId?: number;
  unreadCount?: number;
  lastMessageAt?: string;
};

export type ChatMessage = {
  id: string;
  senderId: number | null;
  receiverId: number | null;
  text: string;
  createdAt: string;
  isMine: boolean;
};

type RealTimeChatProps = {
  serviceId: number;
  receiverId: number;
  currentUserId: number;
  threads?: ChatThread[];
  title?: string;
  emptyStateText?: string;
  className?: string;
};

const resolveResponseArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;

  for (const key of ['data', 'items', 'messages', 'result']) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const normalizeMessage = (item: unknown, currentUserId: number): ChatMessage | null => {
  if (!item || typeof item !== 'object') return null;

  const record = item as Record<string, unknown>;

  const text =
    typeof record.messageText === 'string'
      ? record.messageText
      : typeof record.text === 'string'
        ? record.text
        : typeof record.content === 'string'
          ? record.content
          : '';

  if (!text) return null;

  const senderId =
    typeof record.senderId === 'number'
      ? record.senderId
      : typeof record.senderUserId === 'number'
        ? record.senderUserId
        : typeof record.senderId === 'string'
          ? Number(record.senderId)
          : typeof record.senderUserId === 'string'
            ? Number(record.senderUserId)
            : null;

  const receiverId =
    typeof record.receiverId === 'number'
      ? record.receiverId
      : typeof record.receiverUserId === 'number'
        ? record.receiverUserId
        : typeof record.receiverId === 'string'
          ? Number(record.receiverId)
          : typeof record.receiverUserId === 'string'
            ? Number(record.receiverUserId)
            : null;

  const createdAt =
    typeof record.createdAt === 'string'
      ? record.createdAt
      : typeof record.sentAt === 'string'
        ? record.sentAt
        : typeof record.createdDate === 'string'
          ? record.createdDate
          : new Date().toISOString();

  return {
    id: String(record.id ?? `${senderId ?? 'unknown'}-${createdAt}-${Math.random().toString(16).slice(2)}`),
    senderId,
    receiverId,
    text,
    createdAt,
    isMine: senderId === currentUserId,
  };
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function RealTimeChat({
  serviceId,
  receiverId,
  currentUserId,
  threads = [],
  title = 'Live Messages',
  emptyStateText = 'No messages yet for this service.',
  className = '',
}: RealTimeChatProps) {
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string>(
    threads[0]?.id ?? `service-${serviceId}`,
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const defaultThreads = useMemo<ChatThread[]>(() => {
    if (threads.length > 0) return threads;
    return [
      {
        id: `service-${serviceId}`,
        title: `Shipment ${serviceId}`,
        serviceId,
        receiverId,
        unreadCount: 0,
      },
    ];
  }, [receiverId, serviceId, threads]);

  const filteredThreads = useMemo(() => {
    if (!search.trim()) return defaultThreads;
    const value = search.toLowerCase();
    return defaultThreads.filter((thread) => thread.title.toLowerCase().includes(value));
  }, [defaultThreads, search]);

  const activeThread =
    filteredThreads.find((thread) => thread.id === activeThreadId) ?? defaultThreads[0] ?? null;

  const fetchMessages = async () => {
    if (!serviceId) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5254/api/v1/Messaging/GetServiceMessages?serviceId=${serviceId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const payload = await response.json();
      const normalized = resolveResponseArray(payload)
        .map((item) => normalizeMessage(item, currentUserId))
        .filter((item): item is ChatMessage => Boolean(item));

      setMessages(normalized);
    } catch (error) {
      console.error('Unable to load current chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMessages();

    const intervalId = window.setInterval(() => {
      void fetchMessages();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [serviceId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !serviceId || !receiverId) return;

    setIsSending(true);

    try {
      const response = await fetch('http://localhost:5254/api/v1/Messaging/SendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          receiverId,
          messageText: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Send failed: ${response.status}`);
      }

      setMessageInput('');
      await fetchMessages();
    } catch (error) {
      console.error('Unable to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`flex h-[680px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40 ${className}`}>
      <aside className="flex w-full max-w-[320px] flex-col border-r border-slate-200 bg-slate-50/80">
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
              {defaultThreads.length}
            </span>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search threads"
              className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No chats found.</div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.id === (activeThread?.id ?? activeThreadId);

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`flex w-full items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-left transition ${
                    isActive ? 'bg-blue-50' : 'bg-transparent hover:bg-slate-100/90'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{thread.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {thread.unreadCount && thread.unreadCount > 0 ? `${thread.unreadCount} unread` : 'Active thread'}
                    </p>
                  </div>

                  {thread.unreadCount && thread.unreadCount > 0 ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                      {thread.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{activeThread?.title ?? 'Shipment Conversation'}</p>
            <p className="text-[11px] text-slate-500">{activeThread?.serviceId ? `Service ID: ${activeThread.serviceId}` : `Receiver ID: ${receiverId}`}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
            {activeThread?.title.slice(0, 2).toUpperCase() ?? 'ST'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5">
          {isLoading && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">{emptyStateText}</div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${message.isMine ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.isMine
                          ? 'rounded-br-md bg-slate-900 text-white'
                          : 'rounded-bl-md bg-slate-200 text-slate-800'
                      }`}
                    >
                      {message.text}
                    </div>
                    <span className={`mt-1 block text-[10px] ${message.isMine ? 'text-right text-slate-500' : 'text-left text-slate-400'}`}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <button
              type="button"
              aria-label="Attach document"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <input
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 border-0 bg-transparent px-1 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={isSending || !messageInput.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
