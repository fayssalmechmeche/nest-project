import { defineStore } from "pinia";
import type { UserState, OtherUser } from "../types/interface";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as null | UserState,
    otherUsers: [] as OtherUser[],
  }),
  actions: {
    setUser(userData: any) {
      const userWithDefaults = {
        ...userData,
        profileColor: userData.profileColor || "#3B82F6",
      };

      this.user = userWithDefaults;
      localStorage.setItem("user", JSON.stringify(userWithDefaults));
    },

    updateUserColor(color: string) {
      if (this.user) {
        this.user.profileColor = color;
        localStorage.setItem("user", JSON.stringify(this.user));
      }
    },

    updateOtherUsers(users: OtherUser[]) {
      this.otherUsers = users.filter((user) =>
        this.user ? user.userId !== this.user.id : true
      );
    },

    addOrUpdateOtherUser(user: OtherUser) {
      if (this.user && user.userId === this.user.id) return;

      const index = this.otherUsers.findIndex((u) => u.userId === user.userId);
      if (index !== -1) {
        this.otherUsers[index] = user;
      } else {
        this.otherUsers.push(user);
      }
    },

    removeOtherUser(userId: string) {
      this.otherUsers = this.otherUsers.filter((u) => u.userId !== userId);
    },

    getUserColor(userId: string, username: string): string {
      if (
        this.user &&
        (this.user.id === userId || this.user.username === username)
      ) {
        return this.user.profileColor;
      }

      const otherUser = this.otherUsers.find(
        (u) => u.userId === userId || u.username === username
      );

      return otherUser?.profileColor || "#3B82F6";
    },

    clearUser() {
      this.user = null;
      this.otherUsers = [];
      localStorage.removeItem("user");
    },

    initUser() {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          this.user = parsedUser;
        } catch (e) {
          console.error(
            "Erreur lors de la lecture de l'utilisateur du localStorage:",
            e
          );
          localStorage.removeItem("user");
        }
      }
    },
  },
});
