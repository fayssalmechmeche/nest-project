<template>
    <div class="flex w-full h-full">
        <!-- Chat principal -->
        <div class="flex-1 flex flex-col">
            <div class="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <div class="flex items-center">
                    <h2 class="font-bold">{{ activeRoom?.name }}</h2>
                    <div class="ml-3 flex items-center text-sm">
                        <users-icon :size="14" />
                        <span class="ml-1">{{ activeRoomUsersCount }}</span>
                    </div>
                </div>
                <div class="flex space-x-4">
                    <div class="cursor-pointer" @click="$emit('showProfile')">
                        <settings-icon :size="20" />
                    </div>
                    <log-out-icon class="cursor-pointer" :size="20" @click="$emit('leaveRoom')" />
                </div>
            </div>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 bg-gray-50" ref="messagesContainer">
                <div class="space-y-4">
                    <ChatMessage v-for="(message, index) in messages" :key="index" :message="message"
                        :current-user="currentUser" />
                </div>
            </div>

            <!-- Input de message -->
            <div class="p-4 bg-white border-t">
                <div class="flex">
                    <input type="text" v-model="messageInput" @keyup.enter="handleSendMessage"
                        placeholder="Tapez votre message..."
                        class="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <button @click="handleSendMessage" class="px-4 py-2 rounded-r-lg hover:opacity-90 transition"
                        :style="sendButtonStyle">
                        <send-icon :size="20" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Sidebar des utilisateurs connectés -->
        <UserSidebar :connected-users="connectedUsers" :current-user="currentUser" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { SettingsIcon, LogOutIcon, SendIcon, UsersIcon } from 'lucide-vue-next';
import ChatMessage from '../components/ChatMessage.vue';
import UserSidebar from '../components/UserSidebar.vue';
import { getContrastColor } from '../utils/colors';
import type { ChatMessage as ChatMessageType, RoomData, UserData, CurrentUser } from '../types/interface';

interface Props {
    activeRoom: RoomData | null;
    activeRoomUsersCount: number;
    messages: ChatMessageType[];
    connectedUsers: UserData[];
    currentUser: CurrentUser;
}

interface Emits {
    (e: 'sendMessage', content: string): void;
    (e: 'leaveRoom'): void;
    (e: 'showProfile'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const messageInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const sendButtonStyle = computed(() => ({
    backgroundColor: props.currentUser.profileColor,
    color: getContrastColor(props.currentUser.profileColor)
}));

const handleSendMessage = () => {
    if (messageInput.value.trim() !== '') {
        emit('sendMessage', messageInput.value);
        messageInput.value = '';
    }
};

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
};

// Faire défiler vers le bas quand de nouveaux messages arrivent
watch(() => props.messages.length, () => {
    scrollToBottom();
});

onMounted(() => {
    scrollToBottom();
});
</script>