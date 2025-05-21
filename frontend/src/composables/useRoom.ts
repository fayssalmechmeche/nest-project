import { ref } from "vue";
import { apiService } from "../lib/api";
import type {
  RoomData,
  ChatMessage,
  UserData,
  SocketJoinRoomResponse,
} from "../types/interface";

export function useRooms() {
  const rooms = ref<RoomData[]>([]);
  const loading = ref(true);
  const activeRoom = ref<RoomData | null>(null);
  const activeRoomId = ref<string>("");
  const activeRoomUsersCount = ref<number>(0);
  const messages = ref<ChatMessage[]>([]);
  const connectedUsers = ref<UserData[]>([]);

  const loadRooms = async (getRoomsFunction?: () => Promise<any>) => {
    loading.value = true;
    try {
      if (getRoomsFunction) {
        const socketResponse = await getRoomsFunction();
        if (socketResponse.success) {
          rooms.value = socketResponse.rooms;
          return;
        }
      }

      // Fallback sur l'API REST
      const apiRooms = await apiService.getRooms();
      rooms.value = apiRooms.map((room) => ({
        id: room.id,
        name: room.name,
        usersCount: room.userCount || 0,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des rooms:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const setActiveRoom = (response: SocketJoinRoomResponse) => {
    activeRoom.value = {
      id: response.roomId,
      name: response.roomName,
      usersCount: response.usersCount,
    };

    activeRoomId.value = response.roomId;
    activeRoomUsersCount.value = response.usersCount;
    messages.value = response.messages || [];

    // Initialiser la liste des utilisateurs
    if (response.users && Array.isArray(response.users)) {
      connectedUsers.value = response.users;
    } else {
      connectedUsers.value = [];
    }
  };

  const clearActiveRoom = () => {
    activeRoom.value = null;
    activeRoomId.value = "";
    activeRoomUsersCount.value = 0;
    messages.value = [];
    connectedUsers.value = [];
  };

  const addMessage = (message: ChatMessage) => {
    messages.value.push(message);
  };

  const updateUsersCount = (usersCount: number) => {
    activeRoomUsersCount.value = usersCount;
  };

  const addUser = (userId: string, username: string) => {
    const userExists = connectedUsers.value.some(
      (user) => user.userId === userId
    );
    if (!userExists) {
      connectedUsers.value.push({ userId, username });
    }
  };

  const removeUser = (userId: string) => {
    connectedUsers.value = connectedUsers.value.filter(
      (user) => user.userId !== userId
    );
  };

  const addRoom = (room: RoomData) => {
    rooms.value.push(room);
  };

  return {
    // State
    rooms,
    loading,
    activeRoom,
    activeRoomId,
    activeRoomUsersCount,
    messages,
    connectedUsers,

    // Actions
    loadRooms,
    setActiveRoom,
    clearActiveRoom,
    addMessage,
    updateUsersCount,
    addUser,
    removeUser,
    addRoom,
  };
}
