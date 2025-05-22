<template>
    <div class="w-full mx-auto max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="p-4 bg-indigo-600 text-white flex justify-between items-center">
            <h1 class="text-xl font-bold">Tous les salons</h1>
            <div class="flex items-center space-x-3">
                <div class="flex items-center cursor-pointer" @click="$emit('showProfile')">
                    <user-icon :size="20" />
                    <span class="ml-2">{{ currentUser.username }}</span>
                    <div class="w-4 h-4 rounded-full ml-2" :style="{ backgroundColor: currentUser.profileColor }"
                        title="Couleur de profil">
                    </div>
                </div>
            </div>
        </div>

        <div class="p-4">
            <div class="relative mb-4">
                <input type="text" placeholder="Rechercher une room..." class="w-full pl-10 pr-4 py-2 border rounded-lg"
                    v-model="searchTerm" />
                <search-icon class="absolute left-3 top-2.5 text-gray-400" :size="18" />
            </div>

            <div class="mb-4">
                <button
                    class="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition"
                    @click="handleCreateRoom">
                    <plus-icon :size="20" />
                    <span>Créer une nouvelle room</span>
                </button>
            </div>

            <div class="space-y-3">
                <div v-for="room in filteredRooms" :key="room.id"
                    class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                    @click="$emit('joinRoom', room)">
                    <div class="flex justify-between items-center">
                        <h3 class="font-medium text-lg">{{ room.name }}</h3>
                        <div class="flex items-center text-gray-500">
                            <users-icon :size="16" />
                            <span class="ml-1">{{ room.usersCount }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="filteredRooms.length === 0 && !loading" class="text-center py-8 text-gray-500">
                    Aucune room ne correspond à votre recherche.
                </div>

                <div v-if="loading" class="text-center py-8 text-gray-500">
                    Chargement des rooms...
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { SearchIcon, UserIcon, PlusIcon, UsersIcon } from "lucide-vue-next";
import type { RoomData, CurrentUser } from "../types/interface";

interface Props {
    rooms: RoomData[];
    loading: boolean;
    currentUser: CurrentUser;
}

interface Emits {
    (e: 'joinRoom', room: RoomData): void;
    (e: 'createRoom', roomName: string): void;
    (e: 'showProfile'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchTerm = ref('');

const filteredRooms = computed(() =>
    props.rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);

const handleCreateRoom = () => {
    const roomName = prompt('Entrez le nom de la nouvelle room:');
    if (roomName && roomName.trim() !== '') {
        emit('createRoom', roomName.trim());
    }
};
</script>