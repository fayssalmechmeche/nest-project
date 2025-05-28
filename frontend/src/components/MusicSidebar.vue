<template>
    <div class="w-80 bg-white border-r flex flex-col p-4">
        <h2 class="text-lg font-semibold mb-4">🎵 Musique</h2>

        <!-- Recherche -->
        <input v-model="searchTerm" @keyup.enter="searchMusic" placeholder="Rechercher une musique..."
            class="w-full px-3 py-2 border rounded mb-3" />

        <!-- Résultats de recherche -->
        <div v-if="searchResults.length" class="mb-4">
            <h3 class="text-sm font-semibold mb-2">Résultats</h3>
            <div class="max-h-32 overflow-y-auto">
                <div v-for="track in searchResults" :key="track.id"
                    class="flex items-center justify-between mb-2 p-2 hover:bg-gray-50 rounded">
                    <img :src="track.artwork" alt="cover" class="w-10 h-10 rounded" />
                    <div class="flex-1 mx-2">
                        <div class="text-sm font-medium truncate">{{ track.title }}</div>
                    </div>
                    <button @click="addToQueue(track)"
                        class="text-indigo-600 hover:text-indigo-800 text-sm px-2 py-1 rounded"
                        title="Ajouter à la file">
                        ➕
                    </button>
                </div>
            </div>
        </div>

        <!-- Lecteur actuel -->
        <div v-if="musicState.currentTrack" class="mb-4 p-3 bg-gray-100 rounded-lg">
            <h3 class="text-sm font-semibold mb-2">🎵 En cours</h3>
            <div class="flex items-center mb-2">
                <img :src="musicState.currentTrack.artwork" alt="cover" class="w-12 h-12 rounded mr-3" />
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ musicState.currentTrack.title }}</div>
                    <div class="text-xs text-gray-500">par {{ musicState.currentTrack.addedBy }}</div>
                </div>
            </div>

            <!-- Barre de progression -->
            <div class="mb-2">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{{ formatTime(musicState.currentTime) }}</span>
                    <span>{{ formatTime(musicState.currentTrack.duration) }}</span>
                </div>
                <div class="w-full bg-gray-300 rounded-full h-1 cursor-pointer" @click="handleProgressClick">
                    <div class="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                        :style="{ width: progressPercentage + '%' }"></div>
                </div>
            </div>

            <!-- Contrôles de lecteur -->
            <div class="flex justify-center space-x-3">
                <button @click="previousTrack" class="p-2 hover:bg-gray-200 rounded" title="Précédent">
                    ⏮
                </button>
                <button @click="togglePlayPause" class="p-2 hover:bg-gray-200 rounded text-lg">
                    {{ musicState.isPlaying ? '⏸' : '▶️' }}
                </button>
                <button @click="nextTrack" class="p-2 hover:bg-gray-200 rounded" title="Suivant">
                    ⏭
                </button>
            </div>
        </div>

        <!-- File d'attente -->
        <div class="flex-1 overflow-hidden">
            <h3 class="text-sm font-semibold mb-2">File d'attente ({{ musicState.queue.length }})</h3>
            <div class="space-y-2 overflow-y-auto max-h-64">
                <div v-for="(track, index) in musicState.queue" :key="track.id"
                    class="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                    :class="{ 'bg-indigo-50 border-l-4 border-indigo-500': index === musicState.currentTrackIndex }">
                    <div class="flex items-center flex-1 min-w-0">
                        <img :src="track.artwork" alt="cover" class="w-8 h-8 rounded mr-2" />
                        <div class="flex-1 min-w-0">
                            <div class="text-sm truncate">{{ track.title }}</div>
                            <div class="text-xs text-gray-500">{{ track.addedBy }}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span v-if="index === musicState.currentTrackIndex" class="text-xs text-indigo-600">
                            ▶️
                        </span>
                        <button v-if="index !== musicState.currentTrackIndex" @click="removeFromQueue(index)"
                            class="text-red-500 hover:text-red-700 text-xs" title="Supprimer">
                            ❌
                        </button>
                    </div>
                </div>

                <div v-if="musicState.queue.length === 0" class="text-center text-gray-500 text-sm py-4">
                    Aucune musique dans la file d'attente
                </div>
            </div>
        </div>

        <!-- Volume -->
        <div class="mt-4 pt-4 border-t">
            <label class="text-sm font-medium block mb-2">🔊 Volume : {{ volume }}%</label>
            <input type="range" min="0" max="100" v-model="volume" @input="updateVolume" class="w-full" />
        </div>

        <!-- Debug info (à supprimer en production) -->
        <div class="mt-2 p-2 bg-yellow-50 text-xs text-gray-600 rounded">
            <div>Room: {{ props.activeRoomId }}</div>
            <div>Current Track Index: {{ musicState.currentTrackIndex }}</div>
            <div>Is Playing: {{ musicState.isPlaying }}</div>
            <div>Queue Length: {{ musicState.queue.length }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useSocket } from "../composables/useSocket";

interface Track {
    id: string;
    title: string;
    previewUrl: string;
    artwork: string;
    duration: number;
    addedBy: string;
}

interface MusicState {
    currentTrack: Track | null;
    currentTrackIndex: number | undefined;
    isPlaying: boolean;
    currentTime: number;
    queue: Track[];
}

const props = defineProps<{
    activeRoomId: string;
}>();

const socketComposable = useSocket();
const { socket, isConnected } = socketComposable;

const searchTerm = ref("");
const searchResults = ref<any[]>([]);
const volume = ref(50);
const currentAudio = ref<HTMLAudioElement | null>(null);
const progressUpdateInterval = ref<number | null>(null);

const musicState = ref<MusicState>({
    currentTrack: null,
    currentTrackIndex: undefined,
    isPlaying: false,
    currentTime: 0,
    queue: []
});

const progressPercentage = computed(() => {
    if (!musicState.value.currentTrack) return 0;
    return Math.min(100, (musicState.value.currentTime / musicState.value.currentTrack.duration) * 100);
});

const searchMusic = async () => {
    if (!searchTerm.value.trim()) return;

    try {
        const response = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm.value)}&entity=song&limit=10`
        );
        const data = await response.json();

        searchResults.value = data.results
            .filter((track: any) => track.previewUrl)
            .map((track: any) => ({
                id: track.trackId.toString(),
                title: `${track.artistName} - ${track.trackName}`,
                previewUrl: track.previewUrl,
                artwork: track.artworkUrl100 || track.artworkUrl60,
            }));
    } catch (error) {
        console.error("Erreur lors de la recherche de musique :", error);
    }
};

const addToQueue = async (track: any) => {
    if (!props.activeRoomId || !isConnected.value) {
        console.warn("Pas de room active ou socket non connecté");
        return;
    }

    try {
        const response = await socketComposable.addToQueue(props.activeRoomId, track);
        console.log("Réponse addToQueue:", response);

        if (response.success) {
            searchResults.value = [];
            searchTerm.value = "";
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout à la queue:", error);
    }
};

const togglePlayPause = async () => {
    if (!props.activeRoomId || !isConnected.value) return;

    try {
        const response = await socketComposable.playPause(props.activeRoomId);
        console.log("Réponse playPause:", response);
    } catch (error) {
        console.error("Erreur togglePlayPause:", error);
    }
};

const nextTrack = async () => {
    if (!props.activeRoomId || !isConnected.value) return;

    try {
        const response = await socketComposable.nextTrack(props.activeRoomId);
        console.log("Réponse nextTrack:", response);
    } catch (error) {
        console.error("Erreur nextTrack:", error);
    }
};

const previousTrack = async () => {
    if (!props.activeRoomId || !isConnected.value) return;

    try {
        const response = await socketComposable.previousTrack(props.activeRoomId);
        console.log("Réponse previousTrack:", response);
    } catch (error) {
        console.error("Erreur previousTrack:", error);
    }
};

const removeFromQueue = async (index: number) => {
    if (!props.activeRoomId || !isConnected.value) return;

    try {
        const response = await socketComposable.removeFromQueue(props.activeRoomId, index);
        console.log("Réponse removeFromQueue:", response);
    } catch (error) {
        console.error("Erreur removeFromQueue:", error);
    }
};

const handleProgressClick = (event: MouseEvent) => {
    if (!musicState.value.currentTrack || !props.activeRoomId) return;

    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * musicState.value.currentTrack.duration;

    socketComposable.seekTo(props.activeRoomId, newTime);
};

const playCurrentTrack = () => {
    if (!musicState.value.currentTrack) return;

    console.log("Tentative de lecture:", musicState.value.currentTrack.title);


    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value.removeEventListener('loadeddata', () => {
            console.log("Audio chargé, durée:", currentAudio.value?.duration);
            if (currentAudio.value) {
                currentAudio.value.currentTime = musicState.value.currentTime;
                if (musicState.value.isPlaying) {
                    currentAudio.value.play().then(() => {
                        console.log("Lecture démarrée");
                    }).catch(err => {
                        console.error('Erreur de lecture audio:', err);
                    });
                }
            }
        });
        currentAudio.value.removeEventListener('ended', () => {
            console.log("Piste terminée, passage à la suivante");
            nextTrack();
        });
        currentAudio.value = null;
    }

    try {
        const audio = new Audio();
        audio.src = musicState.value.currentTrack.previewUrl;
        audio.volume = volume.value / 100;
        audio.crossOrigin = "anonymous";

        currentAudio.value = audio;

        const onAudioLoaded = () => {
            console.log("Audio chargé, durée:", audio.duration);
            audio.currentTime = musicState.value.currentTime;

            if (musicState.value.isPlaying) {
                audio.play().then(() => {
                    console.log("Lecture démarrée");
                }).catch(err => {
                    console.error('Erreur de lecture audio:', err);
                });
            }
        };

        const onAudioEnded = () => {
            console.log("Piste terminée, passage à la suivante");
            nextTrack();
        };

        audio.addEventListener('loadeddata', onAudioLoaded);
        audio.addEventListener('ended', onAudioEnded);
        audio.addEventListener('error', (e) => {
            console.error('Erreur audio:', e);
        });

        audio.load();

    } catch (error) {
        console.error('Erreur lors de la création de l\'élément audio:', error);
    }
};

const stopCurrentTrack = () => {
    if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value = null;
    }
};

const updateVolume = () => {
    if (currentAudio.value) {
        currentAudio.value.volume = volume.value / 100;
    }
};

const syncAudioWithState = () => {
    console.log("Synchronisation audio:", musicState.value);

    if (!musicState.value.currentTrack) {
        stopCurrentTrack();
        return;
    }


    if (!currentAudio.value ||
        currentAudio.value.src !== musicState.value.currentTrack.previewUrl) {
        playCurrentTrack();
        return;
    }

    const timeDiff = Math.abs(currentAudio.value.currentTime - musicState.value.currentTime);
    if (timeDiff > 2) {
        currentAudio.value.currentTime = musicState.value.currentTime;
    }

    if (musicState.value.isPlaying && currentAudio.value.paused) {
        currentAudio.value.play().catch(err => {
            console.error('Erreur de lecture audio:', err);
        });
    } else if (!musicState.value.isPlaying && !currentAudio.value.paused) {
        currentAudio.value.pause();
    }
};

const updateLocalTime = () => {
    if (currentAudio.value && musicState.value.isPlaying && !currentAudio.value.paused) {
        musicState.value.currentTime = currentAudio.value.currentTime;
    }
};

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const loadMusicState = async () => {
    if (!props.activeRoomId || !isConnected.value) return;

    try {
        const response = await socketComposable.getMusicState(props.activeRoomId);
        console.log("État musical récupéré:", response);

        if (response.success && response.musicState) {
            musicState.value = response.musicState;
            syncAudioWithState();
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'état musical:", error);
    }
};

onMounted(() => {
    console.log("MusicSidebar monté, room:", props.activeRoomId);

    if (isConnected.value && props.activeRoomId) {
        loadMusicState();
    }

    socketComposable.onMusicStateChanged((data: {
        currentTrack: Track | null;
        currentTrackIndex: number | undefined;
        isPlaying: boolean;
        currentTime: number;
        queue: Track[];
    }) => {
        console.log("Nouvel état musical reçu:", data);
        musicState.value = {
            currentTrack: data.currentTrack,
            currentTrackIndex: data.currentTrackIndex,
            isPlaying: data.isPlaying,
            currentTime: data.currentTime,
            queue: data.queue
        };
        syncAudioWithState();
    });

    socketComposable.onQueueUpdated((data: {
        queue: Track[];
        currentTrackIndex?: number;
    }) => {
        console.log("Queue mise à jour:", data);
        musicState.value.queue = data.queue;
        if (data.currentTrackIndex !== undefined) {
            musicState.value.currentTrackIndex = data.currentTrackIndex;
        }
    });

    progressUpdateInterval.value = window.setInterval(updateLocalTime, 1000);
});

onUnmounted(() => {
    console.log("MusicSidebar démonté");

    socketComposable.removeListener('musicStateChanged');
    socketComposable.removeListener('queueUpdated');

    stopCurrentTrack();

    if (progressUpdateInterval.value) {
        clearInterval(progressUpdateInterval.value);
    }
});

watch(() => props.activeRoomId, (newRoomId, oldRoomId) => {
    console.log("Room changée de", oldRoomId, "vers", newRoomId);

    if (newRoomId && isConnected.value) {
        loadMusicState();
    } else {
        musicState.value = {
            currentTrack: null,
            currentTrackIndex: undefined,
            isPlaying: false,
            currentTime: 0,
            queue: []
        };
        stopCurrentTrack();
    }
});

watch(isConnected, (connected) => {
    console.log("Connexion socket:", connected);
    if (connected && props.activeRoomId) {
        loadMusicState();
    }
});
</script>