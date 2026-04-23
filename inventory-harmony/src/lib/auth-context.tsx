import * as React from "react";
import { decodeJwt } from "./format";

type JwtUser = {
  id?: string;
  email?: string;
  perfil?: "admin" | "gerente" | "operador";
  empresa_id?: string;
  nome?: string;
  nome_empresa?: string;
};

type AuthState = {
  token: string | null;
  user: JwtUser | null;
  empresa: any | null;
  setSession: (token: string, user?: any, empresa?: any) => void;
  logout: () => void;
};

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<JwtUser | null>(null);
  const [empresa, setEmpresa] = React.useState<any | null>(null);

  const setSession = React.useCallback((tk: string, u?: any, emp?: any) => {
    const decoded = decodeJwt(tk) || {};
    setToken(tk);
    setUser({ ...decoded, ...(u || {}) });
    if (emp) setEmpresa(emp);
  }, []);

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    setEmpresa(null);
  }, []);

  const value = React.useMemo(
    () => ({ token, user, empresa, setSession, logout }),
    [token, user, empresa, setSession, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}

export function useApi() {
  const { token } = useAuth();
  return React.useCallback(
    async <T = any,>(path: string, opts: RequestInit = {}): Promise<T> => {
      const { api } = await import("./api");
      return api<T>(path, { ...opts, token });
    },
    [token],
  );
}
