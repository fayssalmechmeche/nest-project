/*
  Warnings:

  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `music_room_states` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `music_tracks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `music_votes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `room_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_roomId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_userId_fkey";

-- DropForeignKey
ALTER TABLE "music_room_states" DROP CONSTRAINT "music_room_states_currentTrackId_fkey";

-- DropForeignKey
ALTER TABLE "music_room_states" DROP CONSTRAINT "music_room_states_roomId_fkey";

-- DropForeignKey
ALTER TABLE "music_tracks" DROP CONSTRAINT "music_tracks_roomId_fkey";

-- DropForeignKey
ALTER TABLE "music_tracks" DROP CONSTRAINT "music_tracks_suggestedById_fkey";

-- DropForeignKey
ALTER TABLE "music_votes" DROP CONSTRAINT "music_votes_musicId_fkey";

-- DropForeignKey
ALTER TABLE "music_votes" DROP CONSTRAINT "music_votes_userId_fkey";

-- DropForeignKey
ALTER TABLE "room_users" DROP CONSTRAINT "room_users_roomId_fkey";

-- DropForeignKey
ALTER TABLE "room_users" DROP CONSTRAINT "room_users_userId_fkey";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "music_room_states";

-- DropTable
DROP TABLE "music_tracks";

-- DropTable
DROP TABLE "music_votes";

-- DropTable
DROP TABLE "room_users";

-- DropTable
DROP TABLE "rooms";
