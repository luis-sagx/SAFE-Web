import { IsBoolean } from 'class-validator';

/// El único campo del participante que se puede tocar por esta vía.
/// `whitelist` + `forbidNonWhitelisted` (app.setup.ts) rechazan con 400
/// cualquier otro campo, así que esto no necesita reforzarse aquí.
export class PatchMeDto {
  @IsBoolean()
  onboardingVisto: boolean;
}
