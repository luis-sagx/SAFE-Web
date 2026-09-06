-- Conserva la calificación firmada al emitir el certificado. Las filas
-- históricas se actualizan al volver a canjear una atestación vigente.
ALTER TABLE "Certificate" ADD COLUMN "calificacion" INTEGER NOT NULL DEFAULT 0;
