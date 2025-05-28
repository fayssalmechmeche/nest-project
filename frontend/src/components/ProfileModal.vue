<template>
    <div v-if="isVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-80">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">Paramètres de profil</h3>
                <x-icon class="cursor-pointer" :size="20" @click="$emit('close')" />
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Votre nom</label>
                <div class="text-lg">{{ currentUser.username }}</div>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Couleur de profil</label>
                <div class="flex items-center justify-between">
                    <input type="color" v-model="selectedColor" class="w-10 h-10 rounded cursor-pointer" />
                    <div class="flex-1 ml-3">
                        <div class="bg-gray-100 rounded-lg p-3">
                            <div class="rounded-lg px-3 py-2 text-sm" :style="previewStyle">
                                Prévisualisation de vos messages
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end space-x-2 pt-4 border-t">
                <button @click="$emit('close')" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Annuler
                </button>
                <button @click="handleSave" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Enregistrer
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { XIcon } from "lucide-vue-next";
import { getContrastColor } from "../utils/colors";
import type { CurrentUser } from "../types/interface";

interface Props {
    isVisible: boolean;
    currentUser: CurrentUser;
}

interface Emits {
    (e: 'close'): void;
    (e: 'save', color: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedColor = ref('#3B82F6');

const previewStyle = computed(() => ({
    backgroundColor: selectedColor.value,
    color: getContrastColor(selectedColor.value)
}));

const handleSave = () => {
    emit('save', selectedColor.value);
};

watch(() => props.currentUser.profileColor, (newColor) => {
    selectedColor.value = newColor;
}, { immediate: true });
</script>