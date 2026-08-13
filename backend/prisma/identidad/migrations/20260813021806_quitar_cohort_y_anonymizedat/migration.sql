/*
  Warnings:

  - You are about to drop the column `anonymizedAt` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `cohort` on the `Participant` table. All the data in the column will be lost.
  - Made the column `nombre` on table `Participant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `apellido` on table `Participant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "anonymizedAt",
DROP COLUMN "cohort",
ALTER COLUMN "nombre" SET NOT NULL,
ALTER COLUMN "apellido" SET NOT NULL;
