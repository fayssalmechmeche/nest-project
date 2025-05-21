<template>
    <div class="flex" :class="isOwnMessage ? 'justify-end' : 'justify-start'">
        <div class="max-w-xs md:max-w-md rounded-lg px-4 py-2 shadow" :style="messageStyle"
            :class="isOwnMessage ? '' : 'border'">
            <div v-if="!isOwnMessage" class="flex items-center mb-1">
                <div class="w-2 h-2 rounded-full mr-2"
                    :style="{ backgroundColor: message.profileColor || '#3B82F6' }" />
                <span class="font-medium text-sm">{{ message.user }}</span>
            </div>
            <p>{{ message.content }}</p>
            <div class="text-xs mt-1 text-right" :style="timestampStyle">
                {{ formatTime(message.timestamp) }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getContrastColor } from "../utils/colors";
import type { ChatMessage, CurrentUser } from "../types/interface";

interface Props {
    message: ChatMessage;
    currentUser: CurrentUser;
}

const props = defineProps<Props>();

const isOwnMessage = computed(() =>
    props.message.user === props.currentUser.username
);

const messageStyle = computed(() => {
    if (isOwnMessage.value) {
        return {
            backgroundColor: props.currentUser.profileColor,
            color: getContrastColor(props.currentUser.profileColor)
        };
    } else if (props.message.profileColor) {
        return {
            backgroundColor: props.message.profileColor,
            color: getContrastColor(props.message.profileColor)
        };
    } else {
        return {
            backgroundColor: 'white',
            color: 'black'
        };
    }
});

const timestampStyle = computed(() => {
    if (isOwnMessage.value) {
        return {
            color: getContrastColor(props.currentUser.profileColor, true)
        };
    } else if (props.message.profileColor) {
        return {
            color: getContrastColor(props.message.profileColor, true)
        };
    } else {
        return {
            color: 'rgba(0, 0, 0, 0.6)'
        };
    }
});

const formatTime = (date: Date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>
