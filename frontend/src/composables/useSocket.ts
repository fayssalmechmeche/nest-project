// composables/useSocket.ts
import { ref, onUnmounted } from "vue";
import { io, Socket } from "socket.io-client";

interface Track {
  id: string;
  title: string;
  previewUrl: string;
  artwork: string;
  duration: number;
  addedBy: string;
}

interface MusicState {
  currentTrack: Track | null;
  currentTrackIndex: number | undefined;
  isPlaying: boolean;
  currentTime: number;
  queue: Track[];
}

interface ChatMessage {
  user: string;
  content: string;
  timestamp: Date;
  profileColor?: string;
}

interface UserData {
  userId: string;
  username: string;
  profileColor?: string;
}

interface RoomData {
  id: string;
  name: string;
  usersCount: number;
}

const socket = ref<Socket | null>(null);
const isConnected = ref(false);

export function useSocket() {
  const connect = (username: string) => {
    if (socket.value?.connected) return;

    socket.value = io("http://localhost:3001", {
      auth: {
        username: username,
      },
    });

    socket.value.on("connect", () => {
      isConnected.value = true;
      console.log("Connecté au serveur WebSocket");
    });

    socket.value.on("disconnect", () => {
      isConnected.value = false;
      console.log("Déconnecté du serveur WebSocket");
    });

    socket.value.on("connect_error", (error) => {
      console.error("Erreur de connexion:", error);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  // === MÉTHODES CHAT ===
  const createRoom = (roomName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("createRoom", { roomName }, (response: any) => {
        resolve(response);
      });
    });
  };

  const joinRoom = (
    roomId: string,
    username: string,
    profileColor?: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit(
        "joinRoom",
        { roomId, username, profileColor },
        (response: any) => {
          resolve(response);
        }
      );
    });
  };

  const leaveRoom = (roomId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("leaveRoom", { roomId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const sendMessage = (
    roomId: string,
    content: string,
    username: string,
    profileColor?: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit(
        "sendMessage",
        { roomId, content, username, profileColor },
        (response: any) => {
          resolve(response);
        }
      );
    });
  };

  const getRooms = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("getRooms", {}, (response: any) => {
        resolve(response);
      });
    });
  };

  // === MÉTHODES MUSICALES ===
  const addToQueue = (roomId: string, track: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("addToQueue", { roomId, track }, (response: any) => {
        resolve(response);
      });
    });
  };

  const playPause = (roomId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("playPause", { roomId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const nextTrack = (roomId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("nextTrack", { roomId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const previousTrack = (roomId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("previousTrack", { roomId }, (response: any) => {
        resolve(response);
      });
    });
  };

  const seekTo = (roomId: string, time: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("seekTo", { roomId, time }, (response: any) => {
        resolve(response);
      });
    });
  };

  const removeFromQueue = (
    roomId: string,
    trackIndex: number
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit(
        "removeFromQueue",
        { roomId, trackIndex },
        (response: any) => {
          resolve(response);
        }
      );
    });
  };

  const getMusicState = (roomId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket.value) {
        reject(new Error("Socket non connecté"));
        return;
      }

      socket.value.emit("getMusicState", { roomId }, (response: any) => {
        resolve(response);
      });
    });
  };

  // === ÉCOUTEURS D'ÉVÉNEMENTS ===
  const onNewMessage = (
    callback: (data: { roomId: string; message: ChatMessage }) => void
  ) => {
    socket.value?.on("newMessage", callback);
  };

  const onUserJoined = (
    callback: (data: {
      roomId: string;
      userId: string;
      username: string;
      profileColor?: string;
      usersCount: number;
    }) => void
  ) => {
    socket.value?.on("userJoined", callback);
  };

  const onUserLeft = (
    callback: (data: {
      roomId: string;
      userId: string;
      username: string;
      usersCount: number;
    }) => void
  ) => {
    socket.value?.on("userLeft", callback);
  };

  const onMusicStateChanged = (callback: (data: MusicState) => void) => {
    socket.value?.on("musicStateChanged", callback);
  };

  const onQueueUpdated = (
    callback: (data: { queue: Track[]; currentTrackIndex?: number }) => void
  ) => {
    socket.value?.on("queueUpdated", callback);
  };

  // === NETTOYAGE ===
  const removeAllListeners = () => {
    socket.value?.removeAllListeners();
  };

  const removeListener = (event: string, callback?: Function) => {
    if (callback) {
      socket.value?.off(event, callback as (...args: any[]) => void);
    } else {
      socket.value?.off(event);
    }
  };

  // Nettoyage automatique
  onUnmounted(() => {
    disconnect();
  });

  return {
    socket: socket.value,
    isConnected,
    connect,
    disconnect,

    // Chat methods
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    getRooms,

    // Music methods
    addToQueue,
    playPause,
    nextTrack,
    previousTrack,
    seekTo,
    removeFromQueue,
    getMusicState,

    // Event listeners
    onNewMessage,
    onUserJoined,
    onUserLeft,
    onMusicStateChanged,
    onQueueUpdated,

    // Cleanup
    removeAllListeners,
    removeListener,
  };
}

// Export pour utilisation globale
export { socket, isConnected };
