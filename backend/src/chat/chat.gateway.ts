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

  // Structure pour stocker les informations des rooms
  private rooms: Map<string, RoomInfo> = new Map();

  // Mapper les IDs de socket aux noms d'utilisateur
  private usernames: Map<string, string> = new Map();

  // Connexion d'un client
  handleConnection(client: Socket) {
    console.log(`Client connecté: ${client.id}`);

    // Récupérer le nom d'utilisateur à partir des données d'authentification
    const username = client.handshake.auth?.username || 'Anonyme';

    // Stocker le nom d'utilisateur
    this.usernames.set(client.id, username);

    console.log(`Utilisateur connecté: ${username} (${client.id})`);
  }

  // Déconnexion d'un client
  handleDisconnect(client: Socket) {
    console.log(`Client déconnecté: ${client.id}`);

    // Récupérer le nom d'utilisateur
    const username = this.usernames.get(client.id) || 'Anonyme';
    console.log(`Utilisateur déconnecté: ${username} (${client.id})`);

    // Supprimer l'utilisateur de la map des noms d'utilisateur
    this.usernames.delete(client.id);

    // Quitter automatiquement toutes les rooms auxquelles le client était connecté
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

  // Créer une nouvelle room
  @SubscribeMessage('createRoom')
  createRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomName: string },
  ) {
    const roomId = `room_${Date.now()}`;
    const username = this.usernames.get(client.id) || 'Anonyme';

    // Création de la room
    this.rooms.set(roomId, {
      id: roomId,
      name: data.roomName,
      users: [],
      messages: [],
    });

    console.log(`Room créée: ${roomId} - ${data.roomName} par ${username}`);

    return {
      success: true,
      roomId,
      roomName: data.roomName,
    };
  }

  // Rejoindre une room
  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { roomId: string; username: string; profileColor?: string },
  ) {
    const { roomId, username, profileColor } = data;

    // Utiliser le nom d'utilisateur fourni ou celui stocké lors de la connexion
    const effectiveUsername =
      username || this.usernames.get(client.id) || 'Anonyme';

    // Mettre à jour le nom d'utilisateur stocké si nécessaire
    if (username && username !== this.usernames.get(client.id)) {
      this.usernames.set(client.id, username);
    }

    console.log(
      `Tentative de rejoindre room: ${roomId} par ${effectiveUsername} (${client.id})`,
    );

    // Vérifier si la room existe
    if (!this.rooms.has(roomId)) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }

    // Ajouter l'utilisateur à la room
    await client.join(roomId);

    // Mettre à jour les informations de la room
    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }

    // Supprimer d'abord les entrées existantes pour cet utilisateur
    const existingUserIndex = roomInfo.users.findIndex(
      (user) => user.socketId === client.id,
    );
    if (existingUserIndex !== -1) {
      roomInfo.users.splice(existingUserIndex, 1);
    }

    // Ajouter l'utilisateur à la room avec sa couleur de profil
    roomInfo.users.push({
      socketId: client.id,
      username: effectiveUsername,
      profileColor, // Ajout de la couleur du profil
    });

    console.log(
      `Utilisateur ${effectiveUsername} (${client.id}) a rejoint la room ${roomId}`,
    );
    console.log(
      `Utilisateurs dans la room ${roomId}:`,
      roomInfo.users.map((u) => u.username),
    );

    // Informer les autres utilisateurs de la room qu'un nouvel utilisateur a rejoint
    this.server.to(roomId).emit('userJoined', {
      roomId,
      userId: client.id,
      username: effectiveUsername,
      profileColor, // Ajout de la couleur du profil
      usersCount: roomInfo.users.length,
    });

    // Préparer la liste des utilisateurs à renvoyer
    const users = roomInfo.users.map((user) => ({
      userId: user.socketId,
      username: user.username,
      profileColor: user.profileColor, // Inclure la couleur du profil
    }));

    // Retourner les informations de la room au client
    return {
      success: true,
      roomId,
      roomName: roomInfo.name,
      usersCount: roomInfo.users.length,
      messages: roomInfo.messages,
      users, // Renvoyer la liste complète des utilisateurs avec leurs couleurs
    };
  }

  // Quitter une room
  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;

    // Vérifier si la room existe
    if (!this.rooms.has(roomId)) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }

    // Faire quitter la room à l'utilisateur
    await client.leave(roomId);

    // Récupérer le nom d'utilisateur
    const username = this.usernames.get(client.id) || 'Anonyme';

    // Mettre à jour les informations de la room
    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }
    const index = roomInfo.users.findIndex(
      (user) => user.socketId === client.id,
    );
    if (index !== -1) {
      roomInfo.users.splice(index, 1);
    }

    // Informer les autres utilisateurs de la room que l'utilisateur a quitté
    this.server.to(roomId).emit('userLeft', {
      roomId,
      userId: client.id,
      username,
      usersCount: roomInfo.users.length,
    });

    return {
      success: true,
    };
  }

  // Envoyer un message dans une room
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

    // Utiliser le nom d'utilisateur fourni ou celui stocké lors de la connexion
    const username =
      data.username || this.usernames.get(client.id) || 'Anonyme';

    // Vérifier si la room existe
    if (!this.rooms.has(roomId)) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }

    // Créer le message avec la couleur du profil
    const message = {
      user: username,
      content,
      timestamp: new Date(),
      profileColor, // Inclure la couleur du profil dans le message
    };

    // Stocker le message dans la room
    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }
    roomInfo.messages.push(message);

    // Envoyer le message à tous les utilisateurs de la room
    this.server.to(roomId).emit('newMessage', {
      roomId,
      message,
    });

    return {
      success: true,
    };
  }

  // Obtenir le nombre d'utilisateurs connectés à une room
  @SubscribeMessage('getRoomUsersCount')
  getRoomUsersCount(@MessageBody() data: { roomId: string }) {
    const { roomId } = data;

    // Vérifier si la room existe
    if (!this.rooms.has(roomId)) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }

    const roomInfo = this.rooms.get(roomId);
    if (!roomInfo) {
      return {
        success: false,
        message: "Cette room n'existe pas",
      };
    }

    return {
      success: true,
      roomId,
      roomName: roomInfo.name,
      usersCount: roomInfo.users.length,
    };
  }

  // Obtenir la liste de toutes les rooms disponibles
  @SubscribeMessage('getRooms')
  getRooms() {
    const roomsList = Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      usersCount: room.users.length,
    }));

    return {
      success: true,
      rooms: roomsList,
    };
  }
}
