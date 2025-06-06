<template>
    <div class="flex h-screen bg-gray-100">
        <RoomList v-if="currentView === 'rooms'" :rooms="rooms" :loading="loading" :current-user="currentUser"
            @join-room="handleJoinRoom" @create-room="handleCreateRoom" @show-profile="showProfileSettings = true" />

        <ChatView v-else :active-room="activeRoom" :active-room-users-count="activeRoomUsersCount" :messages="messages"
            :connected-users="connectedUsers" :current-user="currentUser" @send-message="handleSendMessage"
            @leave-room="handleLeaveRoom" @show-profile="showProfileSettings = true" />

        <ProfileModal :is-visible="showProfileSettings" :current-user="currentUser" @close="showProfileSettings = false"
            @save="handleSaveProfile" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import RoomList from "../components/RoomList.vue";
import ChatView from "../views/ChatView.vue";
import ProfileModal from "../components/ProfileModal.vue";
import { useSocket } from "../composables/useSocket";
import { useUser } from "../composables/useUser";
import { useRooms } from "../composables/useRoom";
import type { RoomData } from "../types/interface";

const currentView = ref<'rooms' | 'chat'>('rooms');
const showProfileSettings = ref(false);

const { currentUser, initializeUser, updateUserProfile } = useUser();
const {
    rooms,
    loading,
    activeRoom,
    activeRoomId,
    activeRoomUsersCount,
    messages,
    connectedUsers,
    loadRooms,
    setActiveRoom,
    clearActiveRoom,
    addMessage,
    updateUsersCount,
    addUser,
    removeUser,
    addRoom
} = useRooms();

const {
    connect,
    joinRoom,
    leaveRoom,
    createRoom,
    getRooms,
    sendMessage,
    onNewMessage,
    onUserJoined,
    onUserLeft,
    isConnected
} = useSocket();

onMounted(async () => {
    await initializeUser();
    await ensureSocketConnection();
    await loadRooms(getRooms);
});

const ensureSocketConnection = async () => {
    try {

        if (!isConnected.value) {
            connect(currentUser.username);
            setupSocketListeners();
        }
    } catch (error) {
        console.error('Erreur lors de la connexion socket:', error);
        connect(currentUser.username);
        setupSocketListeners();
    }
};

const setupSocketListeners = () => {
    onNewMessage((data) => {
        if (data.roomId === activeRoomId.value) {
            addMessage(data.message);
        }
    });

    onUserJoined((data) => {
        if (data.roomId === activeRoomId.value) {
            updateUsersCount(data.usersCount);
            addUser(data.userId, data.username);
        }
    });

    onUserLeft((data) => {
        if (data.roomId === activeRoomId.value) {
            updateUsersCount(data.usersCount);
            removeUser(data.userId);
        }
    });
};


const handleCreateRoom = async (roomName: string) => {
    try {
        await ensureSocketConnection();

        const response = await createRoom(roomName);
        if (response.success) {
            const newRoom: RoomData = {
                id: response.roomId,
                name: response.roomName,
                usersCount: 0
            };

            addRoom(newRoom);
            handleJoinRoom(newRoom);
        }
    } catch (error) {
        console.error('Erreur lors de la création de la room:', error);
    }
};

const handleJoinRoom = async (room: RoomData) => {
    try {
        await ensureSocketConnection();

        const response = await joinRoom(
            room.id,
            currentUser.username,
            currentUser.profileColor
        );

        if (response.success) {
            setActiveRoom(response);
            currentView.value = 'chat';
        }
    } catch (error) {
        console.error('Erreur lors de la connexion à la room:', error);

        try {
            console.log('Tentative de reconnexion...');
            connect(currentUser.username);
            setupSocketListeners();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const retryResponse = await joinRoom(
                room.id,
                currentUser.username,
                currentUser.profileColor
            );

            if (retryResponse.success) {
                setActiveRoom(retryResponse);
                currentView.value = 'chat';
            }
        } catch (retryError) {
            console.error('Erreur lors de la tentative de reconnexion:', retryError);
            alert('Impossible de rejoindre la room. Veuillez réessayer.');
        }
    }
};

const handleLeaveRoom = async () => {
    if (!activeRoomId.value) return;

    try {
        const response = await leaveRoom(activeRoomId.value);
        if (response.success) {
            clearActiveRoom();
            currentView.value = 'rooms';

            await loadRooms(getRooms);
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion de la room:', error);
        clearActiveRoom();
        currentView.value = 'rooms';
        await loadRooms(getRooms);
    }
};

const handleSendMessage = async (content: string) => {
    if (activeRoomId.value) {
        try {
            await ensureSocketConnection();

            sendMessage(
                activeRoomId.value,
                content,
                currentUser.username,
                currentUser.profileColor
            );
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            alert('Impossible d\'envoyer le message. Connexion perdue.');
        }
    }
};

const handleSaveProfile = async (color: string) => {
    try {
        await updateUserProfile({ profileColor: color });
        showProfileSettings.value = false;
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la couleur du profil:", error);
        alert("Une erreur est survenue lors de la sauvegarde des paramètres.");
    }
};
</script>