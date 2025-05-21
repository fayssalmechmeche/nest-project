<template>
    <div class="w-64 bg-white border-l hidden md:block">
        <div class="p-4 bg-gray-100 border-b">
            <h3 class="font-medium text-gray-700">Utilisateurs connectés</h3>
        </div>
        <div class="p-2">
            <div v-for="user in connectedUsers" :key="user.userId"
                class="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                <div class="w-3 h-3 rounded-full mr-2 bg-green-400" title="Online" />
                <div class="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                    :style="{ backgroundColor: getUserColor(user) }">
                    <span :style="{ color: getUserTextColor(user) }" class="font-medium">
                        {{ getUserInitial(user) }}
                    </span>
                </div>
                <span>{{ user.username }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getContrastColor } from "../utils/colors";
import type { UserData, CurrentUser } from "../types/interface";

interface Props {
    connectedUsers: UserData[];
    currentUser: CurrentUser;
}

const props = defineProps<Props>();

const getUserColor = (user: UserData): string => {
    if (user.userId === props.currentUser.id) {
        return props.currentUser.profileColor;
    }
    return user.profileColor || '#6366F1';
};

const getUserTextColor = (user: UserData): string => {
    const color = getUserColor(user);
    return getContrastColor(color);
};

const getUserInitial = (user: UserData): string => {
    return user.username ? user.username.charAt(0).toUpperCase() : 'U';
};
</script>