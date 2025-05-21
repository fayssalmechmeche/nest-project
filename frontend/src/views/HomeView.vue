<template>
    <div class="flex h-screen bg-gray-100">
        <!-- Liste des rooms -->
        <div v-if="currentView === 'rooms'"
            class="w-full mx-auto max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
            <div class="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <h1 class="text-xl font-bold">Tous les salons</h1>
                <div class="flex items-center space-x-3">
                    <user-icon :size="20" />
                    <span>{{ currentUser.username }}</span>
                    <div class="w-3 h-3 rounded-full bg-green-400" title="Online" />
                </div>
            </div>

            <div class="p-4">
                <div class="relative mb-4">
                    <input type="text" placeholder="Rechercher une room..."
                        class="w-full pl-10 pr-4 py-2 border rounded-lg" v-model="searchTerm" />
                    <search-icon class="absolute left-3 top-2.5 text-gray-400" :size="18" />
                </div>

                <div class="mb-4">
                    <button
                        class="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-700 transition"
                        @click="createNewRoom">
                        <plus-icon :size="20" />
                        <span>Créer une nouvelle room</span>
                    </button>
                </div>

                <div class="space-y-3">
                    <div v-for="room in filteredRooms" :key="room.id"
                        class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                        @click="joinRoom(room)">
                        <div class="flex justify-between items-center">
                            <h3 class="font-medium text-lg">{{ room.name }}</h3>
                            <div class="flex items-center text-gray-500">
                                <users-icon :size="16" />
                                <span class="ml-1">{{ room.userCount }}</span>
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

        <!-- Chat interface -->
        <div v-else class="flex w-full h-full">
            <!-- Chat principal -->
            <div class="flex-1 flex flex-col">
                <div class="p-4 bg-indigo-600 text-white flex justify-between items-center">
                    <div class="flex items-center">
                        <h2 class="font-bold">{{ activeRoom?.name }}</h2>
                        <div class="ml-3 flex items-center text-sm">
                            <users-icon :size="14" />
                            <span class="ml-1">{{ roomUsers.length }}</span>
                        </div>
                    </div>
                    <div class="flex space-x-4">
                        <music-icon class="cursor-pointer" :size="20" />
                        <settings-icon class="cursor-pointer" :size="20" />
                        <log-out-icon class="cursor-pointer" :size="20" @click="leaveRoom" />
                    </div>
                </div>

                <!-- Messages -->
                <div class="flex-1 overflow-y-auto p-4 bg-gray-50" ref="messagesContainer">
                    <div class="space-y-4">
                        <div v-for="message in messages" :key="message.id"
                            :class="`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`">
                            <div :class="`max-w-xs md:max-w-md ${message.userId === currentUser.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-800 border'
                                } rounded-lg px-4 py-2 shadow`">
                                <div v-if="message.userId !== currentUser.id" class="flex items-center mb-1">
                                    <div class="w-2 h-2 rounded-full mr-2"
                                        :style="{ backgroundColor: message.profileColor }" />
                                    <span class="font-medium text-sm">{{ message.username }}</span>
                                </div>
                                <p>{{ message.content }}</p>
                                <div :class="`text-xs mt-1 text-right ${message.userId === currentUser.id ? 'text-indigo-200' : 'text-gray-500'
                                    }`">
                                    {{ formatMessageTime(message.createdAt) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Input de message -->
                <div class="p-4 bg-white border-t">
                    <div class="flex">
                        <input type="text" v-model="messageInput" @keyup.enter="sendMessage"
                            placeholder="Tapez votre message..."
                            class="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        <button @click="sendMessage"
                            class="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition">
                            <send-icon :size="20" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sidebar des utilisateurs connectés -->
            <div class="w-64 bg-white border-l hidden md:block">
                <div class="p-4 bg-gray-100 border-b">
                    <h3 class="font-medium text-gray-700">Utilisateurs connectés</h3>
                </div>
                <div class="p-2">
                    <div v-for="user in roomUsers" :key="user.id"
                        class="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                        <div class="w-3 h-3 rounded-full mr-2 bg-green-400" title="Online" />
                        <div class="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                            :style="{ backgroundColor: user.profileColor }">
                            <span class="text-white font-medium">
                                {{ user.username.charAt(0).toUpperCase() }}
                            </span>
                        </div>
                        <span>{{ user.username }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, onMounted } from 'vue';
import {
    Search as SearchIcon,
    Settings as SettingsIcon,
    LogOut as LogOutIcon,
    Send as SendIcon,
    Users as UsersIcon,
    Music as MusicIcon,
    User as UserIcon,
    Plus as PlusIcon
} from 'lucide-vue-next';
import { apiService } from '../lib/api';
import type { Room, Message, User } from '../lib/api';
import { useUserStore } from '../store/userStore';
export default defineComponent({
    name: 'RoomChatApp',

    components: {
        SearchIcon,
        SettingsIcon,
        LogOutIcon,
        SendIcon,
        UsersIcon,
        MusicIcon,
        UserIcon,
        PlusIcon
    },

    setup() {
        const rooms = ref<Room[]>([]);
        const loading = ref(true);
        const activeRoom = ref<Room | null>(null);
        const messages = ref<Message[]>([]);
        const messageInput = ref('');
        const roomUsers = ref<User[]>([]);
        const searchTerm = ref('');
        const currentView = ref<'rooms' | 'chat'>('rooms');
        const messagesContainer = ref<HTMLElement | null>(null);
        const userStore = useUserStore();

        // Utilisateur actuel simulé (à remplacer par un vrai système d'authentification)
        const currentUser: User = {
            id: userStore.user?.id,
            username: userStore.user?.username,
            profileColor: userStore.user?.profileColor
        };

        // Charger les rooms depuis l'API
        const loadRooms = async () => {
            loading.value = true;
            try {
                rooms.value = await apiService.getRooms();
            } catch (error) {
                console.error('Erreur lors du chargement des rooms:', error);
                // Afficher une notification d'erreur si nécessaire
            } finally {
                loading.value = false;
            }
        };

        // Charger les rooms au montage du composant
        onMounted(() => {
            loadRooms();
        });

        // Filtrer les rooms en fonction du terme de recherche
        const filteredRooms = computed(() =>
            rooms.value.filter((room: Room) =>
                room.name.toLowerCase().includes(searchTerm.value.toLowerCase())
            )
        );

        // Fonction pour formater la date des messages
        const formatMessageTime = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        // Fonction pour envoyer un message
        const sendMessage = () => {
            if (messageInput.value.trim() !== '' && activeRoom.value) {
                const newMessage: Message = {
                    id: `msg-${Date.now()}`,
                    content: messageInput.value,
                    userId: currentUser.id,
                    username: currentUser.username,
                    profileColor: currentUser.profileColor,
                    createdAt: new Date().toISOString()
                };

                messages.value.push(newMessage);
                messageInput.value = '';

                // Faire défiler vers le dernier message
                nextTick(() => {
                    if (messagesContainer.value) {
                        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                    }
                });

                // Ici, vous pourriez envoyer le message au serveur avec Socket.io
            }
        };

        // Fonction pour rejoindre une room
        const joinRoom = async (room: Room) => {
            try {
                // Charger les détails de la room depuis l'API
                const roomDetails = await apiService.getRoom(room.id);
                if (roomDetails) {
                    activeRoom.value = roomDetails;
                    currentView.value = 'chat';

                    // Actuellement, nous simulons les messages et les utilisateurs
                    // Dans une application réelle, vous les obtiendriez via l'API
                    loadMockMessagesAndUsers();
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la room:', error);
                // Afficher une notification d'erreur si nécessaire
            }
        };

        // Fonction pour quitter une room
        const leaveRoom = () => {
            activeRoom.value = null;
            messages.value = [];
            roomUsers.value = [];
            currentView.value = 'rooms';
        };

        // Créer une nouvelle room via l'API
        const createNewRoom = async () => {
            const newRoomName = prompt('Nom de la nouvelle room:');
            if (newRoomName) {
                try {
                    const newRoom = await apiService.createRoom({ name: newRoomName });
                    rooms.value.push(newRoom);
                    joinRoom(newRoom);
                } catch (error) {
                    console.error('Erreur lors de la création de la room:', error);
                }
            }
        };

        // Fonction temporaire pour charger des données simulées
        // À remplacer par des appels API réels pour les messages et utilisateurs
        const loadMockMessagesAndUsers = () => {
            // Simuler des messages dans la room
            const mockMessages: Message[] = [
                {
                    id: '1',
                    content: 'Bienvenue dans la room!',
                    userId: 'system',
                    username: 'Système',
                    profileColor: '#888',
                    createdAt: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: '2',
                    content: 'Salut tout le monde!',
                    userId: 'user-2',
                    username: 'Alice',
                    profileColor: '#e74c3c',
                    createdAt: new Date(Date.now() - 1800000).toISOString()
                },
                {
                    id: '3',
                    content: 'Comment ça va ?',
                    userId: 'user-3',
                    username: 'Bob',
                    profileColor: '#2ecc71',
                    createdAt: new Date(Date.now() - 900000).toISOString()
                }
            ];

            messages.value = mockMessages;

            // Simuler les utilisateurs dans la room
            roomUsers.value = [
                currentUser,
                { id: 'user-2', username: 'Alice', profileColor: '#e74c3c' },
                { id: 'user-3', username: 'Bob', profileColor: '#2ecc71' },
                { id: 'user-4', username: 'Emma', profileColor: '#f39c12' }
            ];

            // Faire défiler vers le dernier message
            nextTick(() => {
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            });
        };

        return {
            rooms,
            loading,
            activeRoom,
            messages,
            messageInput,
            roomUsers,
            searchTerm,
            currentView,
            currentUser,
            filteredRooms,
            messagesContainer,
            formatMessageTime,
            sendMessage,
            joinRoom,
            leaveRoom,
            createNewRoom
        };
    }
});
</script>