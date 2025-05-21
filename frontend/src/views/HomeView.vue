<template>
    <div class="flex h-screen bg-gray-100">
        <!-- Liste des rooms -->
        <div v-if="currentView === 'rooms'"
            class="w-full mx-auto max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
            <div class="p-4 bg-indigo-600 text-white flex justify-between items-center">
                <h1 class="text-xl font-bold">Tous les salons</h1>
                <div class="flex items-center space-x-3">
                    <div class="flex items-center cursor-pointer" @click="showProfileSettings = true">
                        <user-icon :size="20" />
                        <span class="ml-2">{{ currentUser.username }}</span>
                        <div class="w-3 h-3 rounded-full bg-green-400 ml-2" title="Online" />
                        <!-- Indicateur de couleur du profil -->
                        <div class="w-4 h-4 rounded-full ml-2" :style="{ backgroundColor: currentUser.profileColor }"
                            title="Couleur de profil"></div>
                    </div>
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

        <!-- Chat interface -->
        <div v-else class="flex w-full h-full">
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
                        <div class="cursor-pointer" @click="showProfileSettings = true">
                            <settings-icon :size="20" />
                        </div>
                        <log-out-icon class="cursor-pointer" :size="20" @click="leaveRoom" />
                    </div>
                </div>

                <!-- Messages -->
                <div class="flex-1 overflow-y-auto p-4 bg-gray-50" ref="messagesContainer">
                    <div class="space-y-4">
                        <div v-for="(message, index) in messages" :key="index" class="flex"
                            :class="message.user === currentUser.username ? 'justify-end' : 'justify-start'">
                            <div class="max-w-xs md:max-w-md rounded-lg px-4 py-2 shadow" :style="message.user === currentUser.username ?
                                { backgroundColor: currentUser.profileColor, color: getContrastColor(currentUser.profileColor) } :
                                {}" :class="message.user === currentUser.username ?
                                    '' :
                                    'bg-white text-gray-800 border'">
                                <div v-if="message.user !== currentUser.username" class="flex items-center mb-1">
                                    <div class="w-2 h-2 rounded-full mr-2 bg-blue-500" />
                                    <span class="font-medium text-sm">{{ message.user }}</span>
                                </div>
                                <p>{{ message.content }}</p>
                                <div class="text-xs mt-1 text-right"
                                    :class="message.user === currentUser.username ? '' : 'text-gray-500'" :style="message.user === currentUser.username ?
                                        { color: getContrastColor(currentUser.profileColor, true) } :
                                        {}">
                                    {{ formatMessageTime(message.timestamp) }}
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
                            class="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition"
                            :style="{ backgroundColor: currentUser.profileColor, color: getContrastColor(currentUser.profileColor) }">
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
                    <div v-for="(user, index) in connectedUsers" :key="index"
                        class="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                        <div class="w-3 h-3 rounded-full mr-2 bg-green-400" title="Online" />
                        <div class="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                            :style="{ backgroundColor: user.userId === currentUser.id ? currentUser.profileColor : '#6366F1' }">
                            <span
                                :style="{ color: user.userId === currentUser.id ? getContrastColor(currentUser.profileColor) : 'white' }"
                                class="font-medium">
                                {{ user.username ? user.username.charAt(0).toUpperCase() : 'U' }}
                            </span>
                        </div>
                        <span>{{ user.username }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal pour paramètres de profil -->
        <div v-if="showProfileSettings"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-80">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium">Paramètres de profil</h3>
                    <x-icon class="cursor-pointer" :size="20" @click="showProfileSettings = false" />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Votre nom</label>
                    <div class="text-lg">{{ currentUser.username }}</div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Couleur de profil</label>
                    <div class="flex items-center justify-between">
                        <input type="color" v-model="selectedColor" class="w-10 h-10 rounded cursor-pointer" />
                        <div class="flex-1 ml-3">
                            <div class="bg-gray-100 rounded-lg p-3">
                                <div class="rounded-lg px-3 py-2 text-sm"
                                    :style="{ backgroundColor: selectedColor, color: getContrastColor(selectedColor) }">
                                    Prévisualisation de vos messages
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-2 pt-4 border-t">
                    <button @click="showProfileSettings = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        Annuler
                    </button>
                    <button @click="saveProfileSettings"
                        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
    SearchIcon,
    SettingsIcon,
    LogOutIcon,
    SendIcon,
    UsersIcon,
    MusicIcon,
    UserIcon,
    PlusIcon,
    XIcon
} from 'lucide-vue-next';
import { apiService } from '../lib/api';
import { useUserStore } from '../store/userStore';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
    user: string;
    content: string;
    timestamp: Date;
}

interface RoomData {
    id: string;
    name: string;
    usersCount: number;
}

interface UserData {
    userId: string;
    username: string;
}

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
        PlusIcon,
        XIcon
    },

    setup() {
        const socket = ref<Socket | null>(null);
        const rooms = ref<RoomData[]>([]);
        const loading = ref(true);
        const activeRoom = ref<RoomData | null>(null);
        const activeRoomId = ref<string>('');
        const activeRoomUsersCount = ref<number>(0);
        const messages = ref<ChatMessage[]>([]);
        const messageInput = ref('');
        const connectedUsers = ref<UserData[]>([]);
        const searchTerm = ref('');
        const currentView = ref<'rooms' | 'chat'>('rooms');
        const messagesContainer = ref<HTMLElement | null>(null);
        const userStore = useUserStore();
        userStore.initUser();

        // Paramètres du profil
        const showProfileSettings = ref(false);
        const selectedColor = ref('#3B82F6'); // Couleur par défaut (bleu indigo)

        // Utilisateur actuel - récupéré depuis le store
        const currentUser = ref({
            id: userStore.user?.id || '',
            username: userStore.user?.username || 'Utilisateur',
            profileColor: userStore.user?.profileColor || '#3B82F6'
        });

        // Mettre à jour l'utilisateur actuel depuis le store
        const updateCurrentUser = () => {
            if (userStore.user && userStore.user.username) {
                currentUser.value = {
                    id: userStore.user.id || '',
                    username: userStore.user.username,
                    profileColor: userStore.user.profileColor || '#3B82F6'
                };
                // Synchroniser la couleur sélectionnée avec celle du profil
                selectedColor.value = currentUser.value.profileColor;
            }
        };

        // Initialiser la connexion socket et charger les données initiales
        onMounted(async () => {
            // Vérifier si l'utilisateur est connecté
            try {
                // Si nous avons déjà un utilisateur dans le store, l'utiliser
                if (userStore.user) {
                    updateCurrentUser();
                } else {
                    // Sinon, tenter de récupérer l'utilisateur actuel si les cookies existent
                    const userData = await apiService.getCurrentUser();
                    // Stockez l'utilisateur dans le store pour qu'il persiste
                    userStore.setUser(userData);
                    // Puis mettre à jour l'utilisateur actuel
                    updateCurrentUser();
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            }

            connectSocket();
            loadRooms();
        });

        // Observer les changements de l'utilisateur dans le store
        watch(() => userStore.user, (newUser) => {
            if (newUser) {
                updateCurrentUser();
            }
        }, { deep: true });

        // Déconnexion du socket lors du démontage du composant
        onUnmounted(() => {
            disconnectSocket();
        });

        // Fonction pour déterminer si le texte doit être blanc ou noir selon la couleur de fond
        const getContrastColor = (hexColor: string, isTimestamp = false) => {
            // Convertir la couleur hexadécimale en RGB
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);

            // Calculer la luminosité (formule standard)
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Si c'est pour l'horodatage, on utilise un blanc ou gris plus transparent
            if (isTimestamp) {
                return luminance > 0.5 ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)';
            }

            // Retourner blanc ou noir selon la luminosité
            return luminance > 0.5 ? '#000000' : '#FFFFFF';
        };

        // Sauvegarder les paramètres du profil
        const saveProfileSettings = async () => {
            try {
                // Mise à jour de la couleur du profil dans la BDD via API
                if (currentUser.value.id) {
                    await apiService.updateUserProfile(currentUser.value.id, {
                        profileColor: selectedColor.value
                    });

                    // Mettre à jour le store
                    if (userStore.user) {
                        const updatedUser = {
                            ...userStore.user,
                            profileColor: selectedColor.value
                        };
                        userStore.setUser(updatedUser);

                        // Mettre à jour la référence locale
                        currentUser.value.profileColor = selectedColor.value;
                    }

                    // Fermer le modal
                    showProfileSettings.value = false;
                }
            } catch (error) {
                console.error("Erreur lors de la mise à jour de la couleur du profil:", error);
                alert("Une erreur est survenue lors de la sauvegarde des paramètres.");
            }
        };

        // Connexion au serveur Socket.IO avec authentification
        const connectSocket = () => {
            socket.value = io('http://localhost:3001', {
                withCredentials: true, // Pour envoyer les cookies avec la connexion socket
                auth: {
                    username: currentUser.value.username
                }
            });

            // Écouter les événements du serveur
            if (socket.value) {
                // Événement de connexion réussie
                socket.value.on('connect', () => {
                    console.log('Connecté au serveur Socket.IO');
                    // Mettre à jour les informations d'authentification du socket si l'utilisateur change
                    if (socket.value && 'auth' in socket.value && typeof socket.value.auth === 'object') {
                        socket.value.auth.username = currentUser.value.username;
                    }
                });

                // Recevoir les messages
                socket.value.on('newMessage', (data: { roomId: string, message: ChatMessage }) => {
                    if (data.roomId === activeRoomId.value) {
                        messages.value.push(data.message);
                        scrollToBottom();
                    }
                });

                // Événement quand un utilisateur rejoint une room
                socket.value.on('userJoined', (data: { roomId: string, userId: string, username: string, usersCount: number }) => {
                    if (data.roomId === activeRoomId.value) {
                        activeRoomUsersCount.value = data.usersCount;

                        // Ajouter l'utilisateur à la liste si ce n'est pas déjà présent
                        const userExists = connectedUsers.value.some(user => user.userId === data.userId);
                        if (!userExists) {
                            connectedUsers.value.push({
                                userId: data.userId,
                                username: data.username
                            });
                        }
                    }
                });

                // Événement quand un utilisateur quitte une room
                socket.value.on('userLeft', (data: { roomId: string, userId: string, usersCount: number }) => {
                    if (data.roomId === activeRoomId.value) {
                        activeRoomUsersCount.value = data.usersCount;

                        // Retirer l'utilisateur de la liste
                        connectedUsers.value = connectedUsers.value.filter(user => user.userId !== data.userId);
                    }
                });

                // Déconnexion
                socket.value.on('disconnect', () => {
                    console.log('Déconnecté du serveur Socket.IO');
                });
            }
        };

        // Déconnexion du socket
        const disconnectSocket = () => {
            if (socket.value) {
                socket.value.disconnect();
                socket.value = null;
            }
        };

        // Faire défiler vers le bas du conteneur de messages
        const scrollToBottom = () => {
            nextTick(() => {
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            });
        };

        // Charger les rooms depuis le serveur
        const loadRooms = async () => {
            loading.value = true;
            try {
                // Approche 1: Utiliser le service API existant
                const apiRooms = await apiService.getRooms();

                // Approche 2: Utiliser Socket.IO (si disponible)
                if (socket.value) {
                    socket.value.emit('getRooms', {}, (response: { success: boolean, rooms: RoomData[] }) => {
                        if (response.success) {
                            rooms.value = response.rooms;
                        }
                    });
                } else {
                    // Fallback sur les données API
                    rooms.value = apiRooms.map(room => ({
                        id: room.id,
                        name: room.name,
                        usersCount: room.userCount || 0
                    }));
                }
            } catch (error) {
                console.error('Erreur lors du chargement des rooms:', error);
            } finally {
                loading.value = false;
            }
        };

        // Filtrer les rooms en fonction du terme de recherche
        const filteredRooms = computed(() =>
            rooms.value.filter(room =>
                room.name.toLowerCase().includes(searchTerm.value.toLowerCase())
            )
        );

        // Formater l'heure des messages
        const formatMessageTime = (date: Date) => {
            const messageDate = new Date(date);
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        // Créer une nouvelle room
        const createNewRoom = () => {
            const roomName = prompt('Entrez le nom de la nouvelle room:');
            if (roomName && roomName.trim() !== '' && socket.value) {
                socket.value.emit('createRoom', { roomName }, (response: { success: boolean, roomId: string, roomName: string }) => {
                    if (response.success) {
                        const newRoom: RoomData = {
                            id: response.roomId,
                            name: response.roomName,
                            usersCount: 0
                        };

                        rooms.value.push(newRoom);
                        joinRoom(newRoom);
                    }
                });
            }
        };

        // Rejoindre une room
        const joinRoom = (room: RoomData) => {
            if (socket.value) {
                socket.value.emit('joinRoom', {
                    roomId: room.id,
                    username: currentUser.value.username
                }, (response: {
                    success: boolean,
                    roomId: string,
                    roomName: string,
                    usersCount: number,
                    messages: ChatMessage[],
                    users?: { userId: string, username: string }[]
                }) => {
                    if (response.success) {
                        activeRoom.value = {
                            id: response.roomId,
                            name: response.roomName,
                            usersCount: response.usersCount
                        };

                        activeRoomId.value = response.roomId;
                        activeRoomUsersCount.value = response.usersCount;
                        messages.value = response.messages || [];
                        currentView.value = 'chat';

                        // Initialiser la liste des utilisateurs avec tous les utilisateurs déjà connectés
                        if (response.users && Array.isArray(response.users)) {
                            connectedUsers.value = response.users;
                        } else {
                            // Si le serveur ne renvoie pas la liste des utilisateurs, ajouter au moins l'utilisateur actuel
                            connectedUsers.value = [{
                                userId: currentUser.value.id,
                                username: currentUser.value.username
                            }];
                        }

                        scrollToBottom();
                    }
                });
            }
        };

        // Quitter une room
        const leaveRoom = () => {
            if (socket.value && activeRoomId.value) {
                socket.value.emit('leaveRoom', { roomId: activeRoomId.value }, (response: { success: boolean }) => {
                    if (response.success) {
                        activeRoom.value = null;
                        activeRoomId.value = '';
                        messages.value = [];
                        connectedUsers.value = [];
                        currentView.value = 'rooms';

                        // Rafraîchir la liste des rooms
                        loadRooms();
                    }
                });
            }
        };

        // Envoyer un message
        const sendMessage = () => {
            if (messageInput.value.trim() !== '' && socket.value && activeRoomId.value) {
                socket.value.emit('sendMessage', {
                    roomId: activeRoomId.value,
                    content: messageInput.value,
                    username: currentUser.value.username
                });

                messageInput.value = '';
            }
        };

        return {
            rooms,
            loading,
            activeRoom,
            activeRoomUsersCount,
            messages,
            messageInput,
            connectedUsers,
            searchTerm,
            currentView,
            currentUser: computed(() => currentUser.value), // Exposer comme computed pour la réactivité
            filteredRooms,
            messagesContainer,
            formatMessageTime,
            sendMessage,
            joinRoom,
            leaveRoom,
            createNewRoom,
            // Nouvelles propriétés pour la gestion des couleurs
            showProfileSettings,
            selectedColor,
            getContrastColor,
            saveProfileSettings
        };
    }
});
</script>