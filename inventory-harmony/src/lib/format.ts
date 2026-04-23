export const fmtBRL = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v as number);
};

export const fmtNum = (n: number | string | null | undefined, decimals = 0) => {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(v as number);
};

export const fmtDate = (s: string | Date | null | undefined) => {
  if (!s) return "—";
  const d = typeof s === "string" ? new Date(s) : s;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
};

export const fmtDateTime = (s: string | Date | null | undefined) => {
  if (!s) return "—";
  const d = typeof s === "string" ? new Date(s) : s;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
};

export function decodeJwt(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }
}
