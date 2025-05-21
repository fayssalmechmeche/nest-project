export interface ChatMessage {
  user: string;
  content: string;
  timestamp: Date;
  profileColor?: string;
}

export interface RoomData {
  id: string;
  name: string;
  usersCount: number;
  userCount?: number; // Pour compatibilité API
}

export interface UserData {
  userId: string;
  username: string;
  profileColor?: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  profileColor: string;
}

export interface SocketJoinRoomResponse {
  success: boolean;
  roomId: string;
  roomName: string;
  usersCount: number;
  messages: ChatMessage[];
  users?: UserData[];
}

export interface SocketCreateRoomResponse {
  success: boolean;
  roomId: string;
  roomName: string;
}

export interface SocketGetRoomsResponse {
  success: boolean;
  rooms: RoomData[];
}

export interface UserState {
  id: string;
  username: string;
  profileColor: string;
}

export interface OtherUser {
  userId: string;
  username: string;
  profileColor: string;
}

export interface Room {
  id: string;
  name: string;
  userCount: number;
}

export interface CreateRoomDto {
  name: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  profileColor: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  profileColor: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}

export interface UpdateUserDto {
  profileColor?: string;
}
