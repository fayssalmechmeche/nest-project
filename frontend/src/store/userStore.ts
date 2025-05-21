import { defineStore } from "pinia";
import type { UserState, OtherUser } from "../types/interface";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as null | UserState,
    otherUsers: [] as OtherUser[], // Stockage des couleurs de profil des autres utilisateurs
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

    // Méthode pour mettre à jour les infos des autres utilisateurs, y compris leurs couleurs
    updateOtherUsers(users: OtherUser[]) {
      this.otherUsers = users.filter((user) =>
        this.user ? user.userId !== this.user.id : true
      );
    },

    // Ajouter ou mettre à jour un utilisateur dans la liste
    addOrUpdateOtherUser(user: OtherUser) {
      // Ne pas ajouter l'utilisateur actuel à la liste des autres utilisateurs
      if (this.user && user.userId === this.user.id) return;

      const index = this.otherUsers.findIndex((u) => u.userId === user.userId);
      if (index !== -1) {
        // Mettre à jour l'utilisateur existant
        this.otherUsers[index] = user;
      } else {
        // Ajouter un nouvel utilisateur
        this.otherUsers.push(user);
      }
    },

    // Supprimer un utilisateur de la liste
    removeOtherUser(userId: string) {
      this.otherUsers = this.otherUsers.filter((u) => u.userId !== userId);
    },

    // Récupérer la couleur d'un utilisateur par son ID
    getUserColor(userId: string, username: string): string {
      // Si c'est l'utilisateur actuel
      if (
        this.user &&
        (this.user.id === userId || this.user.username === username)
      ) {
        return this.user.profileColor;
      }

      // Rechercher parmi les autres utilisateurs
      const otherUser = this.otherUsers.find(
        (u) => u.userId === userId || u.username === username
      );

      return otherUser?.profileColor || "#3B82F6"; // Couleur par défaut si non trouvée
    },

    clearUser() {
      this.user = null;
      this.otherUsers = [];
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
