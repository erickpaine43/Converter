/** Error whose message is meant to be shown to the user as is. */
export class AppError extends Error {}

const GENERIC_MESSAGE = 'Ocurrió un error al procesar el archivo. Inténtalo de nuevo o prueba con otro archivo.';

export function toFriendlyErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;

  if (err instanceof Error) {
    const name = err.name;
    const msg = err.message;

    if (name === 'PasswordException' || name === 'EncryptedPDFError' || /encrypted|password/i.test(msg)) {
      return 'Este PDF está protegido con contraseña. Quita la protección antes de subirlo.';
    }

    if (name === 'InvalidPDFException' || /invalid pdf structure|not a valid pdf|corrupt/i.test(msg)) {
      return 'El archivo no es un PDF válido o está dañado.';
    }
  }

  return GENERIC_MESSAGE;
}
