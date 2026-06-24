// Utilidades de archivos del lado cliente: convertir File ↔ base64 para enviar
// a las Server Actions y disparar descargas. (Sin "server-only": se usa en el
// navegador.)

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function downloadBase64(
  base64: string,
  fileName: string,
  mime: string,
): void {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function isPdf(file: File): boolean {
  return /pdf$/i.test(file.type || "") || /\.pdf$/i.test(file.name || "");
}

export function isXlsx(file: File): boolean {
  return (
    /sheet$/i.test(file.type || "") ||
    /\.xlsx?$/i.test(file.name || "")
  );
}
