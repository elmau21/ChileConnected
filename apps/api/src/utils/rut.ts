// Validación y normalización de RUT chileno (con DV).
// Normaliza a formato: "<numero>-<dv>" donde dv está en [0-9K].

export function normalizeRut(input: string): string | null {
  const raw = input.trim().toUpperCase();
  if (!raw) return null;

  // Quita puntos/espacios y deja opcional el guión.
  const cleaned = raw.replace(/[.\s]/g, "");

  const hasDash = cleaned.includes("-");
  let numPart = "";
  let dvPart = "";

  if (hasDash) {
    const [n, dv] = cleaned.split("-");
    numPart = n ?? "";
    dvPart = dv ?? "";
  } else {
    // Caso: "12345678K" o "123456789" (sin guión).
    numPart = cleaned.slice(0, -1);
    dvPart = cleaned.slice(-1);
  }

  if (!numPart || !/^\d+$/.test(numPart)) return null;
  if (!dvPart || !/^[0-9K]$/.test(dvPart)) return null;

  // Algoritmo chileno del DV:
  // multiplicar dígitos (de derecha a izquierda) por factores 2..7 (cíclico),
  // sumar y aplicar módulo 11.
  const digits = numPart
    .split("")
    .reverse()
    .map((d) => Number(d));
  let factor = 2;
  let sum = 0;
  for (const digit of digits) {
    sum += digit * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const remainder = sum % 11;
  const dvCalc = 11 - remainder;

  let dvExpected: string;
  if (dvCalc === 11) dvExpected = "0";
  else if (dvCalc === 10) dvExpected = "K";
  else dvExpected = String(dvCalc);

  if (dvPart !== dvExpected) return null;
  return `${numPart}-${dvExpected}`;
}

