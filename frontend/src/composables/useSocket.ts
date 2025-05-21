import { ref, onUnmounted } from "vue";
import { io, Socket } from "socket.io-client";
import type {
  ChatMessage,
  CurrentUser,
  SocketJoinRoomResponse,
  SocketCreateRoomResponse,
  SocketGetRoomsResponse,
} from "../types/interface";

export function useSocket() {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);

  const connectSocket = (currentUser: CurrentUser) => {
    socket.value = io("http://localhost:3001", {
      withCredentials: true,
      auth: {
        username: currentUser.username,
        profileColor: currentUser.profileColor,
      },
    });

    socket.value.on("connect", () => {
      console.log("Connecté au serveur Socket.IO");
      isConnected.value = true;

      // Mettre à jour les informations d'authentification
      if (
        socket.value &&
        "auth" in socket.value &&
        typeof socket.value.auth === "object"
      ) {
        socket.value.auth.username = currentUser.username;
        socket.value.auth.profileColor = currentUser.profileColor;
      }
    });

    socket.value.on("disconnect", () => {
      console.log("Déconnecté du serveur Socket.IO");
      isConnected.value = false;
    });

    return socket.value;
  };

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const joinRoom = (
    roomId: string,
    username: string,
    profileColor: string
  ): Promise<SocketJoinRoomResponse> => {
    return new Promise((resolve) => {
      if (socket.value) {
        socket.value.emit(
          "joinRoom",
          {
            roomId,
            username,
            profileColor,
          },
          (response: SocketJoinRoomResponse) => {
            resolve(response);
          }
        );
      }
    });
  };

  const leaveRoom = (roomId: string): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
      if (socket.value) {
        socket.value.emit(
          "leaveRoom",
          { roomId },
          (response: { success: boolean }) => {
            resolve(response);
          }
        );
      }
    });
  };

  const createRoom = (roomName: string): Promise<SocketCreateRoomResponse> => {
    return new Promise((resolve) => {
      if (socket.value) {
        socket.value.emit(
          "createRoom",
          { roomName },
          (response: SocketCreateRoomResponse) => {
            resolve(response);
          }
        );
      }
    });
  };

  const getRooms = (): Promise<SocketGetRoomsResponse> => {
    return new Promise((resolve) => {
      if (socket.value) {
        socket.value.emit(
          "getRooms",
          {},
          (response: SocketGetRoomsResponse) => {
            resolve(response);
          }
        );
      }
    });
  };

  const sendMessage = (
    roomId: string,
    content: string,
    username: string,
    profileColor: string
  ) => {
    if (socket.value) {
      socket.value.emit("sendMessage", {
        roomId,
        content,
        username,
        profileColor,
      });
    }
  };

  const onNewMessage = (
    callback: (data: { roomId: string; message: ChatMessage }) => void
  ) => {
    if (socket.value) {
      socket.value.on("newMessage", callback);
    }
  };

  const onUserJoined = (
    callback: (data: {
      roomId: string;
      userId: string;
      username: string;
      usersCount: number;
    }) => void
  ) => {
    if (socket.value) {
      socket.value.on("userJoined", callback);
    }
  };

  const onUserLeft = (
    callback: (data: {
      roomId: string;
      userId: string;
      usersCount: number;
    }) => void
  ) => {
    if (socket.value) {
      socket.value.on("userLeft", callback);
    }
  };

  onUnmounted(() => {
    disconnectSocket();
  });

  return {
    socket,
    isConnected,
    connectSocket,
    disconnectSocket,
    joinRoom,
    leaveRoom,
    createRoom,
    getRooms,
    sendMessage,
    onNewMessage,
    onUserJoined,
    onUserLeft,
  };
}
