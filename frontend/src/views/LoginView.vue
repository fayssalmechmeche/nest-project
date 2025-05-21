<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiService } from '../lib/api';
import { useUserStore } from '../store/userStore';
const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const login = async () => {
    try {
        const response = await apiService.login({
            username: username.value,
            password: password.value
        });

        if (response) {
            error.value = '';
            const user = await apiService.getCurrentUser();
            const userStore = useUserStore();
            userStore.setUser(user);
            await router.push('/home');
        } else {
            error.value = 'Erreur de connexion';
        }
    } catch (err) {
        error.value = 'Erreur de connexion';
    }
};

const register = () => {
    console.log('register');
    router.push('/register');
};

</script>

<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 class="text-2xl font-bold text-center text-gray-800 mb-8">Connexion</h2>

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

                <button type="button"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click="login">
                    Se connecter
                </button>
            </form>

            <p class="mt-4 text-center text-sm text-gray-600">
                Pas encore de compte ?
                <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500" @click="register">
                    S'inscrire
                </a>
            </p>
        </div>
    </div>
</template>

<style scoped></style>
