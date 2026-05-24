/**
 * Feature flags leídos de env vars.
 *
 * Convención: si la var no existe o no es el string esperado, se asume el
 * valor más restrictivo. Esto evita que un deploy mal configurado abra
 * accidentalmente algo que querías cerrado.
 */

/**
 * `true` solo si `SIGNUPS_ENABLED=true` está explícitamente seteado.
 * Default cerrado: si la var falta, el signup público queda deshabilitado y
 * sólo se puede entrar vía credenciales existentes o por invitación.
 */
export function signupsEnabled(): boolean {
  return process.env.SIGNUPS_ENABLED === "true";
}
