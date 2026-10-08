'use client';

import { create } from 'zustand';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useMessagingStore } from '@/modules/message/message.store';
import type { UserMessage } from '@/modules/message/message.type';
import type { Conversation, Message } from './message.types';

interface MessageState {
  conversations: Conversation[];
  activeConversationId: string;
  isMobileChatOpen: boolean;
  filterTab: 'All' | 'Groups' | 'Direct';
  searchQuery: string;
  loading: boolean;
  sending: boolean;
  error: string | null;
  clearError: () => void;
  setActiveConversation: (id: string) => Promise<void>;
  closeMobileChat: () => void;
  setFilterTab: (tab: 'All' | 'Groups' | 'Direct') => void;
  setSearchQuery: (query: string) => void;
  fetchConversations: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
}

const getCurrentUserId = (): string | null => {
  const user = useAuthStore.getState().user;
  return user?.id === undefined || user.id === null ? null : String(user.id);
};

const isExceptionLikeLabel = (value: string | null | undefined): boolean => {
  if (!value) return false;

  const normalized = value.trim();
  if (!normalized) return false;

  return /(?:^|\.)[A-Z][A-Za-z0-9_]*Exception$/u.test(normalized)
    || /(?:^|\s)(?:Error|Exception|Failure)$/iu.test(normalized)
    || /(?:^|\.)System\.[A-Za-z0-9_.]+$/u.test(normalized);
};

const sanitizeTextValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || isExceptionLikeLabel(trimmed)) return null;

  return trimmed;
};

const getUserName = (user: UserMessage['senderUser']): string => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const sanitizedUsername = sanitizeTextValue(user?.username);
  const sanitizedEmail = sanitizeTextValue(user?.email);

  return fullName || sanitizedUsername || sanitizedEmail || 'Unknown user';
};

const getOtherParticipant = (message: UserMessage, currentUserId: string | null) => {
  const sentByMe =
    currentUserId !== null && String(message.senderUserId) === currentUserId;

  return sentByMe
    ? {
        id: message.recipientUserId,
        user: message.recipientUser,
      }
    : {
        id: message.senderUserId,
        user: message.senderUser,
      };
};

const getServiceRecipient = (
  messages: UserMessage[],
  currentUserId: string | null,
): { id: string | number; name: string } | null => {
  const newestFirst = [...messages].sort(
      (first, second) =>
        new Date(second.createdDate ?? second.createAt ?? 0).getTime() -
        new Date(first.createdDate ?? first.createAt ?? 0).getTime(),
  );

  for (const message of newestFirst) {
      if (
        message.recipientUserId !== undefined &&
        message.recipientUserId !== null &&
        String(message.recipientUserId) !== currentUserId
      ) {
        return {
          id: message.recipientUserId,
          name: getUserName(message.recipientUser),
        };
      }

      if (
        message.senderUserId !== undefined &&
        message.senderUserId !== null &&
        String(message.senderUserId) !== currentUserId
      ) {
        return {
          id: message.senderUserId,
          name: getUserName(message.senderUser),
        };
      }
  }

  const service = messages.find((message) => message.service)?.service;
  if (!service) return null;

  const candidates = [
      { id: service.importer?.userId, user: service.importer?.user },
      { id: service.importer?.user?.id, user: service.importer?.user },
      { id: service.createdByUserId, user: service.createdByUser },
      { id: service.createdByUser?.id, user: service.createdByUser },
      { id: service.createdByDataEncoderId, user: service.createdByDataEncoder },
      { id: service.createdByDataEncoder?.id, user: service.createdByDataEncoder },
      { id: service.assignedCaseExecutorId, user: service.assignedCaseExecutor },
      { id: service.assignedCaseExecutor?.id, user: service.assignedCaseExecutor },
      { id: service.assignedAssessorId, user: service.assignedAssessor },
      { id: service.assignedAssessor?.id, user: service.assignedAssessor },
  ];

  for (const candidate of candidates) {
      if (
        (typeof candidate.id === 'number' || typeof candidate.id === 'string') &&
        String(candidate.id) !== currentUserId
      ) {
        return { id: candidate.id, name: getUserName(candidate.user) };
      }
  }

  return null;
};

const formatRelativeTime = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const elapsedMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, 'minute');

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) return formatter.format(elapsedHours, 'hour');

  return formatter.format(Math.round(elapsedHours / 24), 'day');
};

const mapMessages = (messages: UserMessage[], currentUserId: string | null): Message[] =>
  [...messages]
    .sort((first, second) => {
      const firstDate = new Date(first.createdDate ?? first.createAt ?? 0).getTime();
      const secondDate = new Date(second.createdDate ?? second.createAt ?? 0).getTime();
      return firstDate - secondDate;
    })
    .map((message, index) => {
      const timestamp = message.createdDate ?? message.createAt ?? '';
      const sentByMe =
        currentUserId !== null && String(message.senderUserId) === currentUserId;

      return {
        id: String(message.id ?? `${timestamp}-${index}`),
        senderName: getUserName(message.senderUser),
        text: message.content ?? message.subject ?? '',
        timestamp: formatRelativeTime(timestamp),
        isMe: sentByMe,
      };
    });

const getConversationId = (
  message: UserMessage,
  currentUserId: string | null,
  groupServiceIds: Set<string>,
): string | null => {
  const serviceId = message.serviceId ?? message.service?.id;
  if (serviceId !== undefined && serviceId !== null && groupServiceIds.has(String(serviceId))) {
    return `service:${serviceId}`;
  }

  const other = getOtherParticipant(message, currentUserId);
  if (other.id === undefined || other.id === null) return null;
  return `direct:${serviceId ?? 'general'}:${other.id}`;
};

const getGroupServiceIds = (
  messages: UserMessage[],
  currentUserId: string | null,
): Set<string> => {
  const servicePeers = new Map<string, Set<string>>();

  for (const message of messages) {
    const serviceId = message.serviceId ?? message.service?.id;
    if (serviceId === undefined || serviceId === null) continue;

    const other = getOtherParticipant(message, currentUserId);
    if (other.id === undefined || other.id === null) continue;

    const peers = servicePeers.get(String(serviceId)) ?? new Set<string>();
    peers.add(String(other.id));
    servicePeers.set(String(serviceId), peers);
  }

  return new Set(
    [...servicePeers.entries()]
      .filter(([, peers]) => peers.size > 1)
      .map(([serviceId]) => serviceId),
  );
};

const buildConversations = (
  messages: UserMessage[],
  currentUserId: string | null,
): Conversation[] => {
  const groups = new Map<string, UserMessage[]>();
  const groupServiceIds = getGroupServiceIds(messages, currentUserId);

  for (const message of messages) {
    const conversationId = getConversationId(message, currentUserId, groupServiceIds);
    if (!conversationId) continue;
    groups.set(conversationId, [...(groups.get(conversationId) ?? []), message]);
  }

  return [...groups.entries()]
    .sort(([, firstMessages], [, secondMessages]) => {
      const firstLatest = Math.max(
        ...firstMessages.map((message) =>
          new Date(message.createdDate ?? message.createAt ?? 0).getTime(),
        ),
      );
      const secondLatest = Math.max(
        ...secondMessages.map((message) =>
          new Date(message.createdDate ?? message.createAt ?? 0).getTime(),
        ),
      );
      return secondLatest - firstLatest;
    })
    .map(([id, conversationMessages]) => {
      const latest = conversationMessages.reduce((newest, message) =>
        new Date(message.createdDate ?? message.createAt ?? 0).getTime() >
        new Date(newest.createdDate ?? newest.createAt ?? 0).getTime()
          ? message
          : newest,
      );
      const serviceId = latest.serviceId ?? latest.service?.id;
      const isGroup = groupServiceIds.has(String(serviceId));
      const title = isGroup
        ? `${latest.service?.trackingNumber || `Service ${serviceId}`}${latest.subject ? ` — ${latest.subject}` : ''}`
        : getUserName(getOtherParticipant(latest, currentUserId).user);
      const participants = new Map<string, string>();

      for (const message of conversationMessages) {
        if (message.senderUserId !== undefined && message.senderUserId !== null) {
          participants.set(String(message.senderUserId), getUserName(message.senderUser));
        }
        if (message.recipientUserId !== undefined && message.recipientUserId !== null) {
          participants.set(String(message.recipientUserId), getUserName(message.recipientUser));
        }
      }

      const recipient = getServiceRecipient(conversationMessages, currentUserId);
      if (recipient) participants.set(String(recipient.id), recipient.name);
      const mappedMessages = mapMessages(conversationMessages, currentUserId);
      const lastMessage = mappedMessages[mappedMessages.length - 1];

      return {
        id,
        title,
        subtitle: lastMessage?.text ?? '',
        time: formatRelativeTime(latest.createdDate ?? latest.createAt),
        unreadCount: conversationMessages.filter(
          (message) =>
            message.isRead === false &&
            currentUserId !== null &&
            String(message.senderUserId) !== currentUserId,
        ).length,
        type: isGroup ? 'Groups' as const : 'Direct' as const,
        participants: [...participants.values()].map((name) =>
          name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        ),
        serviceId,
        recipientUserId: recipient?.id,
        messages: mappedMessages,
      };
    })
    .sort((first, second) => {
      const firstMessage = first.messages[first.messages.length - 1];
      const secondMessage = second.messages[second.messages.length - 1];
      return (secondMessage?.timestamp ?? '').localeCompare(firstMessage?.timestamp ?? '');
    });
};

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  activeConversationId: '',
  isMobileChatOpen: false,
  filterTab: 'All',
  searchQuery: '',
  loading: false,
  sending: false,
  error: null,
  clearError: () => set({ error: null }),

  setActiveConversation: async (id) => {
    set({ activeConversationId: id, isMobileChatOpen: true, error: null });
    const conversation = get().conversations.find((item) => item.id === id);
    const userMessages = useMessagingStore.getState().userMessages;
    const currentUserId = getCurrentUserId();
    const groupServiceIds = getGroupServiceIds(userMessages, currentUserId);
    let apiMessages = userMessages.filter(
      (message) => getConversationId(message, currentUserId, groupServiceIds) === id,
    );
    if (conversation?.serviceId !== undefined && conversation.serviceId !== null) {
      set({ loading: true });
      const serviceMessages = await useMessagingStore.getState().fetchServiceMessages(conversation.serviceId);
      const serviceError = useMessagingStore.getState().error;
      if (serviceError) {
        set({ error: serviceError, loading: false });
        return;
      }
      if (serviceMessages.length > 0) apiMessages = serviceMessages;
      const messages = mapMessages(apiMessages, currentUserId);
      const recipient = getServiceRecipient(apiMessages, currentUserId);
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item.id === id
            ? {
                ...item,
                messages,
                subtitle: messages[messages.length - 1]?.text ?? item.subtitle,
                recipientUserId: recipient?.id ?? item.recipientUserId,
                participants: recipient
                  ? [
                      ...new Set([
                        ...item.participants,
                        recipient.name
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase(),
                      ]),
                    ]
                  : item.participants,
              }
            : item,
        ),
        loading: false,
      }));
    }

    const unreadMessages = apiMessages.filter(
      (message) =>
        message.isRead === false &&
        message.id !== undefined &&
        message.id !== null &&
        currentUserId !== null &&
        String(message.senderUserId) !== currentUserId,
    );
    await Promise.all(
      unreadMessages.flatMap((message) =>
        message.id === undefined || message.id === null
          ? []
          : [useMessagingStore.getState().markMessageAsRead(message.id)],
      ),
    );
    if (unreadMessages.length > 0) {
      set((state) => ({
        conversations: state.conversations.map((item) =>
          item.id === id ? { ...item, unreadCount: 0 } : item,
        ),
      }));
    }
  },
  closeMobileChat: () => set({ isMobileChatOpen: false }),
  setFilterTab: (filterTab) => set({ filterTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    const messages = await useMessagingStore.getState().fetchUserMessages();
    const fetchError = useMessagingStore.getState().error;
    if (fetchError) {
      set({ loading: false, error: fetchError });
      return;
    }

    const conversations = buildConversations(messages, getCurrentUserId());
    const currentId = get().activeConversationId;
    const activeConversationId = conversations.some((item) => item.id === currentId)
      ? currentId
      : conversations[0]?.id ?? '';
    set({ conversations, activeConversationId, loading: false });

    const active = conversations.find((item) => item.id === activeConversationId);
    if (active?.type === 'Groups' && active.serviceId) {
      await get().setActiveConversation(active.id);
    }
  },

  sendMessage: async (text) => {
    const conversation = get().conversations.find(
      (item) => item.id === get().activeConversationId,
    );
    if (!conversation) {
      set({ error: 'Select a conversation before sending a message.' });
      return;
    }
    const messagingState = useMessagingStore.getState();
    const allMessages = [
      ...messagingState.userMessages,
      ...messagingState.serviceMessages,
    ];
    const currentUserId = getCurrentUserId();
    const groupServiceIds = getGroupServiceIds(allMessages, currentUserId);
    const conversationMessages = allMessages.filter(
      (message) => getConversationId(message, currentUserId, groupServiceIds) === conversation.id,
    );
    const recipient =
      conversation.recipientUserId ??
      getServiceRecipient(conversationMessages, getCurrentUserId())?.id;
    if (recipient === undefined || recipient === null) {
      set({ error: 'A recipient is not available for this conversation.' });
      return;
    }
    const serviceId = conversation.serviceId;
    if (serviceId === undefined || serviceId === null) {
      set({ error: 'A service ID is required to send a message in this conversation.' });
      return;
    }

    set({ sending: true, error: null });
    const result = await useMessagingStore.getState().sendMessage({
      serviceId,
      recipientUserId: recipient,
      content: text.trim(),
      subject: text.trim(),
    });
    if (!result) {
      set({
        sending: false,
        error: useMessagingStore.getState().error ?? 'Failed to send message.',
      });
      return;
    }

    set({ sending: false });
    await get().fetchConversations();
  },
}));
