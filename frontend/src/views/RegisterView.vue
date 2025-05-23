<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiService } from '../lib/api';
import { useUserStore } from '../store/userStore';

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const router = useRouter();

const register = async () => {
    try {
        // Vérification que les mots de passe correspondent
        if (password.value !== confirmPassword.value) {
            error.value = 'Les mots de passe ne correspondent pas';
            return;
        }

        // Vérification des champs obligatoires
        if (!username.value.trim() || !password.value.trim()) {
            error.value = 'Tous les champs sont obligatoires';
            return;
        }

        const response = await apiService.register({
            username: username.value,
            password: password.value
        });

        if (response) {
            error.value = '';
            // Connexion automatique après inscription
            const user = await apiService.getCurrentUser();
            const userStore = useUserStore();
            userStore.setUser(user);
            console.log('user registered', user);
            await router.push('/home');
        } else {
            error.value = 'Erreur lors de l\'inscription';
        }
    } catch (err) {
        error.value = 'Erreur lors de l\'inscription';
    }
};

const goToLogin = () => {
    router.push('/login');
};
</script>

<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold text-center text-gray-800 mb-8">Inscription</h2>

            <form class="space-y-6">
                <div v-if="error" class="text-red-500 text-center mb-4">{{ error }}</div>

                <div>
                    <label for="username" class="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                    <input type="text" id="username"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Nom d'utilisateur" v-model="username" />
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
                    <input type="password" id="password"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="••••••••" v-model="password" />
                </div>

                <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmer le mot de
                        passe</label>
                    <input type="password" id="confirmPassword"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="••••••••" v-model="confirmPassword" />
                </div>

                <button type="button"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click="register">
                    S'inscrire
                </button>
            </form>

            <p class="mt-4 text-center text-sm text-gray-600">
                Déjà un compte ?
                <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500" @click="goToLogin">
                    Se connecter
                </a>
            </p>
        </div>
    </div>
</template>

<style scoped></style>