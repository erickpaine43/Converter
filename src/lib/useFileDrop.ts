import { useEffect, useRef, useState, type DragEvent } from 'react';

interface UseFileDropOptions {
  /** Receives the dropped files; they must go through the same flow as the <input type="file">. */
  onFiles: (files: File[]) => void;
  /** Called instead of onFiles when the dropped items can't be accepted. */
  onReject: (message: string) => void;
  /** Same value as the input's `accept`: browsers do NOT enforce it on drop, so it's checked here. */
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
 * Real drag & drop for .file-drop zones. Without it, dropping a file makes the
 * browser open it and the user leaves the site, losing whatever was loaded.
 * While the hook is mounted, drops on the rest of the page are blocked too, in
 * case the file lands just outside the zone.
 */
export function useFileDrop({ onFiles, onReject, accept, multiple = false }: UseFileDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave also fire when moving over each child of the label, so a
  // counter keeps the highlight from flickering.
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
      // stopPropagation: keep the window listener from overriding dropEffect with 'none'
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
