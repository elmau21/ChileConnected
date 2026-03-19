/**
 * Mensajes amigables para errores de API (timeout, red, 4xx/5xx, rate limit).
 */
const RATE_LIMIT_MSG =
  "Demasiadas solicitudes. Espera un momento e intenta de nuevo.";
const NETWORK_MSG =
  "No hay conexión o el servidor no responde. Revisa tu internet e intenta de nuevo.";
const TIMEOUT_MSG =
  "La solicitud tardó demasiado. Vuelve a intentar en un momento.";
const SERVER_MSG =
  "Algo falló en el servidor. Intenta más tarde.";
const DEFAULT_MSG =
  "Algo salió mal. Intenta de nuevo.";

export function getFriendlyErrorMessage(error: unknown, context?: "evaluar" | "buscar" | "chat"): string {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return NETWORK_MSG;
  }
  const msg = error != null && typeof (error as any).message === "string" ? (error as any).message : String(error);
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) {
    return NETWORK_MSG;
  }
  if (msg === "timeout" || msg.includes("timeout") || msg.includes("Timeout")) {
    return TIMEOUT_MSG;
  }
  if (msg.includes("429") || msg.includes("rate") || msg.includes("demasiadas")) {
    return RATE_LIMIT_MSG;
  }
  if (msg.includes("500") || msg.includes("502") || msg.includes("503")) {
    return SERVER_MSG;
  }
  if (msg.includes("400") && msg.includes("RUT")) {
    return "RUT inválido. Revisa el formato (ej: 12.345.678-9).";
  }
  if (msg.includes("Evaluar falló") || msg.includes("Buscar falló") || msg.includes("Chat falló")) {
    const code = msg.match(/\((\d+)\)/)?.[1];
    if (code === "429") return RATE_LIMIT_MSG;
    if (code && Number(code) >= 500) return SERVER_MSG;
    if (code && Number(code) >= 400) return DEFAULT_MSG;
  }
  return msg || DEFAULT_MSG;
}
