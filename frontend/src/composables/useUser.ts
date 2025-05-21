import { reactive, watch } from "vue";
import { apiService } from "../lib/api";
import { useUserStore } from "../store/userStore";
import type { CurrentUser } from "../types/interface";

export function useUser() {
  const userStore = useUserStore();

  const currentUser = reactive<CurrentUser>({
    id: "",
    username: "Utilisateur",
    profileColor: "#3B82F6",
  });

  const initializeUser = async () => {
    try {
      userStore.initUser();

      if (userStore.user) {
        updateCurrentUser();
      } else {
        const userData = await apiService.getCurrentUser();
        userStore.setUser(userData);
        updateCurrentUser();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      throw error;
    }
  };

  const updateCurrentUser = () => {
    if (userStore.user && userStore.user.username) {
      currentUser.id = userStore.user.id || "";
      currentUser.username = userStore.user.username;
      currentUser.profileColor = userStore.user.profileColor || "#3B82F6";
    }
  };

  const updateUserProfile = async (profileData: { profileColor?: string }) => {
    try {
      if (currentUser.id) {
        await apiService.updateUserProfile(currentUser.id, profileData);

        // Mettre à jour le store
        if (userStore.user) {
          const updatedUser = {
            ...userStore.user,
            ...profileData,
          };
          userStore.setUser(updatedUser);
          updateCurrentUser();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      throw error;
    }
  };

  // Observer les changements de l'utilisateur dans le store
  watch(
    () => userStore.user,
    (newUser) => {
      if (newUser) {
        updateCurrentUser();
      }
    },
    { deep: true }
  );

  return {
    currentUser,
    initializeUser,
    updateCurrentUser,
    updateUserProfile,
  };
}
