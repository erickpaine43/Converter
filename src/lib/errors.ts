/** Error con mensaje ya pensado para mostrarse tal cual al usuario. */
export class AppError extends Error {}

const GENERIC_MESSAGE = 'Ocurrió un error al procesar el archivo. Probá de nuevo o con otro archivo.';

export function toFriendlyErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;

  if (err instanceof Error) {
    const name = err.name;
    const msg = err.message;

    if (name === 'PasswordException' || name === 'EncryptedPDFError' || /encrypted|password/i.test(msg)) {
      return 'Este PDF está protegido con contraseña. Quitá la protección antes de subirlo.';
    }

    if (name === 'InvalidPDFException' || /invalid pdf structure|not a valid pdf|corrupt/i.test(msg)) {
      return 'El archivo no es un PDF válido o está dañado.';
    }
  }

  return GENERIC_MESSAGE;
}
