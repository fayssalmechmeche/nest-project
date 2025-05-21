import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

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

export const apiService = {
  async getRooms(): Promise<Room[]> {
    const response = await api.get<Room[]>("/rooms");
    return response.data;
  },

  async getRoom(id: string): Promise<Room | null> {
    const response = await api.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  async createRoom(room: CreateRoomDto): Promise<Room> {
    const response = await api.post<Room>("/rooms", room);
    return response.data;
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await api.get<User>("/auth/current");
    return response.data;
  },

  async login(loginDto: LoginDto): Promise<User | null> {
    const response = await api.post<User>("/auth/login", loginDto);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async register(registerDto: RegisterDto): Promise<User | null> {
    const response = await api.post<User>("/auth/register", registerDto);
    return response.data;
  },
};
