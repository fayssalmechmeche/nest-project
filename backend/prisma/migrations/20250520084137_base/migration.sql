-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profileColor" TEXT NOT NULL DEFAULT '#3498db',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_tracks" (
    "id" TEXT NOT NULL,
    "spotifyTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "albumCoverUrl" TEXT,
    "previewUrl" TEXT,
    "durationMs" INTEGER,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "isQueued" BOOLEAN NOT NULL DEFAULT false,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "suggestedById" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "music_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "musicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "music_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "music_room_states" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "currentTrackId" TEXT,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "playbackPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_room_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "room_users_userId_roomId_key" ON "room_users"("userId", "roomId");

-- CreateIndex
CREATE INDEX "messages_roomId_idx" ON "messages"("roomId");

-- CreateIndex
CREATE INDEX "music_tracks_roomId_idx" ON "music_tracks"("roomId");

-- CreateIndex
CREATE INDEX "music_votes_musicId_idx" ON "music_votes"("musicId");

-- CreateIndex
CREATE UNIQUE INDEX "music_votes_userId_musicId_key" ON "music_votes"("userId", "musicId");

-- CreateIndex
CREATE UNIQUE INDEX "music_room_states_roomId_key" ON "music_room_states"("roomId");

-- AddForeignKey
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_votes" ADD CONSTRAINT "music_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_votes" ADD CONSTRAINT "music_votes_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "music_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_room_states" ADD CONSTRAINT "music_room_states_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_room_states" ADD CONSTRAINT "music_room_states_currentTrackId_fkey" FOREIGN KEY ("currentTrackId") REFERENCES "music_tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
