-- Marca de si el participante ya vio la pantalla de bienvenida.

ALTER TABLE "Participant" ADD COLUMN "onboardingVistoAt" TIMESTAMP(3);
