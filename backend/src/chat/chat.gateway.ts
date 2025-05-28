import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface RoomInfo {
  id: string;
  name: string;
  users: { socketId: string; username: string; profileColor?: string }[];
  messages: {
    user: string;
    content: string;
    timestamp: Date;
    profileColor?: string;
  }[];
  musicQueue: {
    id: string;
    title: string;
    previewUrl: string;
    artwork: string;
    duration: number;
    addedBy: string;
  }[];
  currentTrackIndex?: number;
  isPlaying: boolean;
  currentTime: number;
  lastUpdateTime: number;
}

@WebSocketGateway(3001, {
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, RoomInfo> = new Map();
  private usernames: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connecté: ${client.id}`);
    const username = client.handshake.auth?.username as string;
    this.usernames.set(client.id, username);
    console.log(`Utilisateur connecté: ${username} (${client.id})`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté: ${client.id}`);
    const username = this.usernames.get(client.id) || 'Anonyme';
    console.log(`Utilisateur déconnecté: ${username} (${client.id})`);
    this.usernames.delete(client.id);

    this.rooms.forEach((roomInfo, roomId) => {
      const index = roomInfo.users.findIndex(
        (user) => user.socketId === client.id,
      );
      if (index !== -1) {
        roomInfo.users.splice(index, 1);
        this.server.to(roomId).emit('userLeft', {
          roomId,
          userId: client.id,
          username,
          usersCount: roomInfo.users.length,
        });
      }
    });
  }

  @SubscribeMessage('createRoom')
  createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomName: string },
  ) {
    const roomId = `room_${Date.now()}`;
    const username = this.usernames.get(client.id) || 'Anonyme';

    this.rooms.set(roomId, {
      id: roomId,
      name: data.roomName,
      users: [],
      messages: [],
      musicQueue: [],
      currentTrackIndex: undefined,
      isPlaying: false,
      currentTime: 0,
      lastUpdateTime: Date.now(),
    });

    console.log(`Room créée: ${roomId} - ${data.roomName} par ${username}`);

    return {
      success: true,
      roomId,
      roomName: data.roomName,
    };
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; username: string; profileColor?: string },
  ) {
    const { roomId, username, profileColor } = data;
    const effectiveUsername =
      username || this.usernames.get(client.id) || 'Anonyme';

    if (username && username !== this.usernames.get(client.id)) {
      this.usernames.set(client.id, username);
    }

    console.log(
      `Tentative de rejoindre room: ${roomId} par ${effectiveUsername} (${client.id})`,
    );

    if (!this.rooms.has(roomId)) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    await client.join(roomId);
    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    const existingUserIndex = roomInfo.users.findIndex(
      (user) => user.socketId === client.id,
    );
    if (existingUserIndex !== -1) {
      roomInfo.users.splice(existingUserIndex, 1);
    }

    roomInfo.users.push({
      socketId: client.id,
      username: effectiveUsername,
      profileColor,
    });

    console.log(
      `Utilisateur ${effectiveUsername} (${client.id}) a rejoint la room ${roomId}`,
    );

    this.server.to(roomId).emit('userJoined', {
      roomId,
      userId: client.id,
      username: effectiveUsername,
      profileColor,
      usersCount: roomInfo.users.length,
    });

    const users = roomInfo.users.map((user) => ({
      userId: user.socketId,
      username: user.username,
      profileColor: user.profileColor,
    }));

    const musicState = this.getCurrentMusicState(roomInfo);

    return {
      success: true,
      roomId,
      roomName: roomInfo.name,
      usersCount: roomInfo.users.length,
      messages: roomInfo.messages,
      users,
      musicState,
    };
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    if (!this.rooms.has(roomId)) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    await client.leave(roomId);
    const username = this.usernames.get(client.id) || 'Anonyme';
    const roomInfo = this.rooms.get(roomId);

    if (!roomInfo) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    const index = roomInfo.users.findIndex(
      (user) => user.socketId === client.id,
    );
    if (index !== -1) {
      roomInfo.users.splice(index, 1);
    }

    this.server.to(roomId).emit('userLeft', {
      roomId,
      userId: client.id,
      username,
      usersCount: roomInfo.users.length,
    });

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomId: string;
      content: string;
      username: string;
      profileColor?: string;
    },
  ) {
    const { roomId, content, profileColor } = data;
    const username =
      data.username || this.usernames.get(client.id) || 'Anonyme';

    if (!this.rooms.has(roomId)) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    const message = {
      user: username,
      content,
      timestamp: new Date(),
      profileColor,
    };

    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    roomInfo.messages.push(message);
    this.server.to(roomId).emit('newMessage', { roomId, message });
    return { success: true };
  }

  @SubscribeMessage('getRoomUsersCount')
  getRoomUsersCount(@MessageBody() data: { roomId: string }) {
    const { roomId } = data;

    if (!this.rooms.has(roomId)) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return { success: false, message: "Cette room n'existe pas" };
    }

    return {
      success: true,
      roomId,
      roomName: roomInfo.name,
      usersCount: roomInfo.users.length,
    };
  }

  @SubscribeMessage('getRooms')
  getRooms() {
    const roomsList = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      usersCount: room.users.length,
    }));

    return { success: true, rooms: roomsList };
  }

  @SubscribeMessage('addToQueue')
  addToQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; track: any },
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room) return { success: false };

    const trackWithId = {
      id: `track_${Date.now()}_${Math.random()}`,
      title: data.track.title as string,
      previewUrl: data.track.previewUrl as string,
      artwork: data.track.artwork as string,
      duration: 30,
      addedBy: this.usernames.get(client.id) || 'Anonyme',
    };

    room.musicQueue.push(trackWithId);

    if (room.currentTrackIndex === undefined && room.musicQueue.length === 1) {
      room.currentTrackIndex = 0;
      room.isPlaying = true;
      room.currentTime = 0;
      room.lastUpdateTime = Date.now();

      this.server.to(data.roomId).emit('musicStateChanged', {
        currentTrack: room.musicQueue[room.currentTrackIndex],
        currentTrackIndex: room.currentTrackIndex,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        queue: room.musicQueue,
      });
    } else {
      this.server.to(data.roomId).emit('queueUpdated', {
        queue: room.musicQueue,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('playPause')
  playPause(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room || room.currentTrackIndex === undefined) {
      return { success: false };
    }

    if (room.isPlaying) {
      const elapsed = (Date.now() - room.lastUpdateTime) / 1000;
      room.currentTime = Math.min(
        room.currentTime + elapsed,
        room.musicQueue[room.currentTrackIndex].duration,
      );
    }

    room.isPlaying = !room.isPlaying;
    room.lastUpdateTime = Date.now();

    this.server.to(data.roomId).emit('musicStateChanged', {
      currentTrack: room.musicQueue[room.currentTrackIndex],
      currentTrackIndex: room.currentTrackIndex,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      queue: room.musicQueue,
    });

    return { success: true };
  }

  @SubscribeMessage('nextTrack')
  nextTrack(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room || !room.musicQueue.length) return { success: false };

    if (room.currentTrackIndex === undefined) return { success: false };

    if (room.currentTrackIndex + 1 < room.musicQueue.length) {
      room.currentTrackIndex += 1;
      room.isPlaying = true;
      room.currentTime = 0;
      room.lastUpdateTime = Date.now();

      this.server.to(data.roomId).emit('musicStateChanged', {
        currentTrack: room.musicQueue[room.currentTrackIndex],
        currentTrackIndex: room.currentTrackIndex,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        queue: room.musicQueue,
      });

      return { success: true };
    } else {
      room.currentTrackIndex = undefined;
      room.isPlaying = false;
      room.currentTime = 0;

      this.server.to(data.roomId).emit('musicStateChanged', {
        currentTrack: null,
        currentTrackIndex: undefined,
        isPlaying: false,
        currentTime: 0,
        queue: room.musicQueue,
      });

      return { success: true, message: "Fin de la file d'attente" };
    }
  }

  @SubscribeMessage('previousTrack')
  previousTrack(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const room = this.rooms.get(data.roomId);
    if (
      !room ||
      !room.musicQueue.length ||
      room.currentTrackIndex === undefined
    ) {
      return { success: false };
    }

    if (room.currentTrackIndex > 0) {
      room.currentTrackIndex -= 1;
      room.isPlaying = true;
      room.currentTime = 0;
      room.lastUpdateTime = Date.now();

      this.server.to(data.roomId).emit('musicStateChanged', {
        currentTrack: room.musicQueue[room.currentTrackIndex],
        currentTrackIndex: room.currentTrackIndex,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        queue: room.musicQueue,
      });

      return { success: true };
    }

    return { success: false, message: 'Déjà au début de la queue' };
  }

  @SubscribeMessage('seekTo')
  seekTo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; time: number },
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room || room.currentTrackIndex === undefined) {
      return { success: false };
    }

    const track = room.musicQueue[room.currentTrackIndex];
    room.currentTime = Math.max(0, Math.min(data.time, track.duration));
    room.lastUpdateTime = Date.now();

    this.server.to(data.roomId).emit('musicStateChanged', {
      currentTrack: track,
      currentTrackIndex: room.currentTrackIndex,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      queue: room.musicQueue,
    });

    return { success: true };
  }

  @SubscribeMessage('removeFromQueue')
  removeFromQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; trackIndex: number },
  ) {
    const room = this.rooms.get(data.roomId);
    if (
      !room ||
      data.trackIndex < 0 ||
      data.trackIndex >= room.musicQueue.length
    ) {
      return { success: false };
    }

    if (room.currentTrackIndex === data.trackIndex) {
      return {
        success: false,
        message: 'Impossible de supprimer la piste en cours',
      };
    }

    room.musicQueue.splice(data.trackIndex, 1);

    if (
      room.currentTrackIndex !== undefined &&
      room.currentTrackIndex > data.trackIndex
    ) {
      room.currentTrackIndex -= 1;
    }

    this.server.to(data.roomId).emit('queueUpdated', {
      queue: room.musicQueue,
      currentTrackIndex: room.currentTrackIndex,
    });

    return { success: true };
  }

  @SubscribeMessage('getMusicState')
  getMusicState(@MessageBody() data: { roomId: string }) {
    const room = this.rooms.get(data.roomId);
    if (!room) return { success: false };

    return {
      success: true,
      musicState: this.getCurrentMusicState(room),
    };
  }

  private getCurrentMusicState(room: RoomInfo) {
    let currentTime = room.currentTime;

    if (room.isPlaying && room.currentTrackIndex !== undefined) {
      const elapsed = (Date.now() - room.lastUpdateTime) / 1000;
      currentTime = Math.min(
        room.currentTime + elapsed,
        room.musicQueue[room.currentTrackIndex]?.duration || 0,
      );

      if (currentTime >= room.musicQueue[room.currentTrackIndex]?.duration) {
        this.autoNextTrack(room);
      }
    }

    return {
      currentTrack:
        room.currentTrackIndex !== undefined
          ? room.musicQueue[room.currentTrackIndex]
          : null,
      currentTrackIndex: room.currentTrackIndex,
      isPlaying: room.isPlaying,
      currentTime,
      queue: room.musicQueue,
    };
  }

  private autoNextTrack(room: RoomInfo) {
    if (room.currentTrackIndex === undefined) return;

    if (room.currentTrackIndex + 1 < room.musicQueue.length) {
      room.currentTrackIndex += 1;
      room.currentTime = 0;
      room.lastUpdateTime = Date.now();
      room.isPlaying = true;
    } else {
      room.currentTrackIndex = undefined;
      room.isPlaying = false;
      room.currentTime = 0;
    }

    this.server.to(room.id).emit('musicStateChanged', {
      currentTrack:
        room.currentTrackIndex !== undefined
          ? room.musicQueue[room.currentTrackIndex]
          : null,
      currentTrackIndex: room.currentTrackIndex,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      queue: room.musicQueue,
    });
  }
}
