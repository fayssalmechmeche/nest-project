import { nextTick } from "vue";
import type { ChatMessage } from "../types/interface";

export function useMessages() {
  const scrollToBottom = (container: HTMLElement | null) => {
    nextTick(() => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  };

  const formatMessageTime = (date: Date): string => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (
    message: ChatMessage,
    currentUsername: string
  ): boolean => {
    return message.user === currentUsername;
  };

  const validateMessage = (content: string): boolean => {
    return content.trim() !== "";
  };

  return {
    scrollToBottom,
    formatMessageTime,
    isOwnMessage,
    validateMessage,
  };
}
