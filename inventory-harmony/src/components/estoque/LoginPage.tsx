import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button, Input, Field } from "@/components/estoque/ui-kit";
import { Boxes } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { setSession } = useAuth();
  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [loading, setLoading] = React.useState(false);

  // login
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  // register
  const [nome, setNome] = React.useState("");
  const [nomeEmpresa, setNomeEmpresa] = React.useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
      setSession(r.token, r.usuario);
      toast.success("Bem-vindo!");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api<any>("/auth/registrar", {
        method: "POST",
        body: JSON.stringify({ nome, email, senha, nome_empresa: nomeEmpresa }),
      });
      setSession(r.token, r.usuario, r.empresa);
      toast.success("Conta criada com sucesso!");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Falha no registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-md bg-primary/15 text-primary">
            <Boxes className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg leading-none">ESTOQUE.OPS</h1>
            <p className="text-xs text-muted-foreground">Gestão industrial de inventário</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-md border border-border bg-surface p-1 font-mono text-xs">
          <button
            className={`rounded py-1.5 uppercase tracking-wider transition-colors ${tab === "login" ? "bg-card text-foreground" : "text-muted-foreground"}`}
            onClick={() => setTab("login")}
          >
            Entrar
          </button>
          <button
            className={`rounded py-1.5 uppercase tracking-wider transition-colors ${tab === "register" ? "bg-card text-foreground" : "text-muted-foreground"}`}
            onClick={() => setTab("register")}
          >
            Criar conta
          </button>
        </div>

        {tab === "login" ? (
          <form className="space-y-3" onSubmit={onLogin}>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Senha">
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={onRegister}>
            <Field label="Seu nome">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </Field>
            <Field label="Nome da empresa">
              <Input
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Senha">
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          API: localhost:3001/api/v1
        </p>
      </div>
    </div>
  );
}
