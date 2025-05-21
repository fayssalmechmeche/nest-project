import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as null | Record<string, any>,
  }),
  actions: {
    setUser(userData: any) {
      this.user = userData;
    },
    clearUser() {
      this.user = null;
    },
  },
});
