/// Mínimo 8 caracteres con una mayúscula, un número y un símbolo. Espejo de
/// PASSWORD_PATTERN en backend/apps/identidad/src/auth/dto/register.dto.ts.
export const PASSWORD_POLICY = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
