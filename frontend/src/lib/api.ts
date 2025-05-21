import axios from "axios";
import type {
  Room,
  CreateRoomDto,
  User,
  LoginDto,
  RegisterDto,
  UpdateUserDto,
} from "../types/interface";
export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

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

  async updateUserProfile(
    userId: string,
    updateData: UpdateUserDto
  ): Promise<User | null> {
    const response = await api.patch<User>(`/users/${userId}`, updateData);
    return response.data;
  },
};
