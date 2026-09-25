import { useEffect, useRef, useState, type DragEvent } from 'react';

interface UseFileDropOptions {
  /** Recibe los archivos soltados; deben pasar por el mismo flujo que el <input type="file">. */
  onFiles: (files: File[]) => void;
  /** Se llama en vez de onFiles cuando lo soltado no se puede aceptar. */
  onReject: (message: string) => void;
  /** Mismo valor que el `accept` del input: el navegador NO lo aplica al soltar, así que se revisa acá. */
  accept?: string;
  multiple?: boolean;
}

function hasFiles(e: { dataTransfer: DataTransfer | null }): boolean {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

export function matchesAccept(file: File, accept: string): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).some(token => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * Drag & drop real para las zonas .file-drop. Sin esto, soltar un archivo hace
 * que el navegador lo abra y el usuario se va del sitio perdiendo lo cargado.
 * Mientras el hook está montado también se bloquea el drop en el resto de la
 * página, por si el archivo cae apenas fuera de la zona.
 */
export function useFileDrop({ onFiles, onReject, accept, multiple = false }: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave se disparan también al pasar por cada hijo del label:
  // un contador evita que el resaltado parpadee.
  const depthRef = useRef(0);

  useEffect(() => {
    const preventOutside = (e: globalThis.DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
    };
    const reset = () => {
      depthRef.current = 0;
      setIsDragging(false);
    };
    window.addEventListener('dragover', preventOutside);
    window.addEventListener('drop', preventOutside);
    window.addEventListener('drop', reset);
    window.addEventListener('dragend', reset);
    return () => {
      window.removeEventListener('dragover', preventOutside);
      window.removeEventListener('drop', preventOutside);
      window.removeEventListener('drop', reset);
      window.removeEventListener('dragend', reset);
    };
  }, []);

  const dropProps = {
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depthRef.current += 1;
      setIsDragging(true);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      // stopPropagation: que el listener de window no pise el dropEffect con 'none'
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!hasFiles(e)) return;
      depthRef.current = Math.max(0, depthRef.current - 1);
      if (depthRef.current === 0) setIsDragging(false);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depthRef.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (!files.length) return;
      if (!multiple && files.length > 1) {
        onReject('Esta herramienta procesa un solo archivo por vez. Suelta solo uno.');
        return;
      }
      if (accept) {
        const rejected = files.find(f => !matchesAccept(f, accept));
        if (rejected) {
          onReject(`"${rejected.name}" no es un tipo de archivo admitido por esta herramienta.`);
          return;
        }
      }
      onFiles(files);
    },
  };

  return { isDragging, dropProps };
}
