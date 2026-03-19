const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const FETCH_TIMEOUT_MS = 25000;

async function fetchWithTimeout(
  url: string,
  opts: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = FETCH_TIMEOUT_MS, ...rest } = opts;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    if ((e as Error).name === "AbortError") {
      throw new Error("timeout");
    }
    throw e;
  }
}

export type Perfil = {
  edad?: number | undefined;
  ingresos_mensuales?: number | undefined;
  region?: string | undefined;
  situacion_laboral?:
    | "empleado"
    | "desempleado"
    | "independiente"
    | "estudiante"
    | "jubilado"
    | "otro"
    | undefined;
  carga_familiar?: number | undefined;
  discapacidad?: boolean | undefined;
  embarazada?: boolean | undefined;
  pueblo_originario?: boolean | undefined;
};

export async function evaluar(params: { rut: string; perfil: Perfil; limit?: number }) {
  const payload: any = { perfil: params.perfil, limit: params.limit ?? 20 };
  payload.rut = params.rut;
  const res = await fetchWithTimeout(`${API_BASE}/evaluar`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Evaluar falló (${res.status})`);
  return (await res.json()) as {
    usuario_id?: string;
    recomendaciones: {
      beneficio_id: string;
      resultado: "elegible" | "posible" | "no_elegible";
      razon: string;
      beneficio?: {
        _id: string;
        nombre: string;
        fuente_url: string;
        fuente: "midesof" | "chileatiende";
        estado: "abierto" | "cerrado";
        monto?: number;
        fecha_inicio?: string;
        fecha_fin?: string;
      };
    }[];
  };
}

export async function buscarBeneficios(
  q?: string,
  opts?: {
    limit?: number;
    offset?: number;
    fuente?: "midesof" | "chileatiende";
    estado?: "abierto" | "cerrado";
  },
) {
  const url = new URL(`${API_BASE}/beneficios`);
  if (q) url.searchParams.set("q", q);
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  if (opts?.offset) url.searchParams.set("offset", String(opts.offset));
  if (opts?.fuente) url.searchParams.set("fuente", opts.fuente);
  if (opts?.estado) url.searchParams.set("estado", opts.estado);
  const res = await fetchWithTimeout(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Buscar falló (${res.status})`);
  return (await res.json()) as {
    items: any[];
  };
}

export async function chat(params: { session_id: string; rut: string; question: string }) {
  const payload: any = { session_id: params.session_id, question: params.question };
  payload.rut = params.rut;
  const res = await fetchWithTimeout(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Chat falló (${res.status})`);
  return (await res.json()) as { answer: string; hits: any[] };
}

export async function loginRut(params: { rut: string }) {
  const res = await fetch(`${API_BASE}/auth/rut`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ rut: params.rut }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Login RUT falló (${res.status})`);
  return (await res.json()) as { usuario_id: string; rut: string };
}

export function openChatWs(): WebSocket {
  const u = new URL(API_BASE);
  const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProto}//${u.host}/ws/chat`;
  return new WebSocket(wsUrl);
}

