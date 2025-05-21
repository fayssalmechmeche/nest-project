import { defineStore } from "pinia";

export interface UserState {
  id: string;
  username: string;
  profileColor: string;
  // Autres propriétés utilisateur si nécessaire
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as null | UserState,
  }),
  actions: {
    setUser(userData: any) {
      // S'assurer que toutes les propriétés sont présentes
      const userWithDefaults = {
        ...userData,
        profileColor: userData.profileColor || "#3B82F6", // Couleur indigo par défaut
      };

      this.user = userWithDefaults;
      // Sauvegarde dans le localStorage
      localStorage.setItem("user", JSON.stringify(userWithDefaults));
    },

    updateUserColor(color: string) {
      if (this.user) {
        this.user.profileColor = color;
        // Mettre à jour dans le localStorage
        localStorage.setItem("user", JSON.stringify(this.user));
      }
    },

    clearUser() {
      this.user = null;
      // Supprime du localStorage
      localStorage.removeItem("user");
    },

    // Récupère l'utilisateur depuis le localStorage lors de l'initialisation
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
