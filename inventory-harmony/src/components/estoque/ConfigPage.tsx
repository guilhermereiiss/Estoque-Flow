import * as React from "react";
import { useApi } from "@/lib/auth-context";
import {
  Button,
  Field,
  Input,
  Select,
  Modal,
  Table,
  Th,
  Td,
  LoadingSpinner,
} from "@/components/estoque/ui-kit";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type Tab = "empresa" | "usuarios" | "conta";

export default function ConfigPage() {
  const [tab, setTab] = React.useState<Tab>("empresa");
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border bg-surface p-1 font-mono text-xs">
        {(["empresa", "usuarios", "conta"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 uppercase tracking-wider transition-colors ${tab === t ? "bg-card text-foreground" : "text-muted-foreground"}`}
          >
            {t === "empresa" ? "Empresa" : t === "usuarios" ? "Usuários" : "Minha conta"}
          </button>
        ))}
      </div>

      {tab === "empresa" && <EmpresaTab />}
      {tab === "usuarios" && <UsuariosTab />}
      {tab === "conta" && <ContaTab />}
    </div>
  );
}

function EmpresaTab() {
  const api = useApi();
  const [form, setForm] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await api<any>(`/empresa`);
        setForm(r);
      } catch (err: any) {
        toast.error(typeof err === "string" ? err : err?.message || "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  if (loading) return <LoadingSpinner />;
  if (!form) return null;

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/empresa`, {
        method: "PUT",
        body: JSON.stringify({
          nome: form.nome,
          cnpj: form.cnpj,
          telefone: form.telefone,
          email_contato: form.email_contato,
          endereco: form.endereco,
          cidade: form.cidade,
          estado: form.estado,
        }),
      });
      toast.success("Empresa atualizada");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="grid max-w-3xl grid-cols-1 gap-3 rounded-md border border-border bg-card p-5 sm:grid-cols-2" onSubmit={submit}>
      <Field label="Nome" className="col-span-2">
        <Input value={form.nome || ""} onChange={(e) => set("nome", e.target.value)} required />
      </Field>
      <Field label="CNPJ">
        <Input value={form.cnpj || ""} onChange={(e) => set("cnpj", e.target.value)} />
      </Field>
      <Field label="Telefone">
        <Input value={form.telefone || ""} onChange={(e) => set("telefone", e.target.value)} />
      </Field>
      <Field label="Email de contato" className="col-span-2">
        <Input
          type="email"
          value={form.email_contato || ""}
          onChange={(e) => set("email_contato", e.target.value)}
        />
      </Field>
      <Field label="Endereço" className="col-span-2">
        <Input value={form.endereco || ""} onChange={(e) => set("endereco", e.target.value)} />
      </Field>
      <Field label="Cidade">
        <Input value={form.cidade || ""} onChange={(e) => set("cidade", e.target.value)} />
      </Field>
      <Field label="Estado">
        <Input
          maxLength={2}
          value={form.estado || ""}
          onChange={(e) => set("estado", e.target.value.toUpperCase())}
        />
      </Field>
      <div className="col-span-2 flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function UsuariosTab() {
  const api = useApi();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openInv, setOpenInv] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<any[]>(`/empresa/usuarios`);
      setItems(Array.isArray(r) ? r : []);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }, [api]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpenInv(true)}>
          <Plus className="size-4" /> Convidar usuário
        </Button>
      </div>
      <Table
        loading={loading}
        empty={items.length === 0}
        head={
          <>
            <Th>Nome</Th>
            <Th>Email</Th>
            <Th>Perfil</Th>
            <Th>Status</Th>
          </>
        }
      >
        {items.map((u: any) => (
          <tr key={u.id}>
            <Td>{u.nome}</Td>
            <Td className="text-muted-foreground">{u.email}</Td>
            <Td>
              <span className="font-mono text-[10px] uppercase tracking-wider">{u.perfil}</span>
            </Td>
            <Td>
              <span
                className={`font-mono text-[10px] uppercase ${u.ativo === false ? "text-destructive" : "text-success"}`}
              >
                {u.ativo === false ? "inativo" : "ativo"}
              </span>
            </Td>
          </tr>
        ))}
      </Table>

      {openInv && (
        <ConvidarModal
          onClose={() => setOpenInv(false)}
          onDone={() => {
            setOpenInv(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ConvidarModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const api = useApi();
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [perfil, setPerfil] = React.useState("operador");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/empresa/usuarios/convidar`, {
        method: "POST",
        body: JSON.stringify({ nome, email, senha, perfil }),
      });
      toast.success("Usuário convidado");
      onDone();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Convidar usuário">
      <form className="space-y-3" onSubmit={submit}>
        <Field label="Nome">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Senha provisória">
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
          />
        </Field>
        <Field label="Perfil">
          <Select value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            <option value="operador">Operador</option>
            <option value="gerente">Gerente</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Convidar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ContaTab() {
  const api = useApi();
  const [atual, setAtual] = React.useState("");
  const [nova, setNova] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/auth/alterar-senha`, {
        method: "PUT",
        body: JSON.stringify({ senha_atual: atual, nova_senha: nova }),
      });
      toast.success("Senha alterada");
      setAtual("");
      setNova("");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="max-w-md space-y-3 rounded-md border border-border bg-card p-5"
      onSubmit={submit}
    >
      <h3 className="font-display text-sm">Alterar senha</h3>
      <Field label="Senha atual">
        <Input
          type="password"
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          required
        />
      </Field>
      <Field label="Nova senha">
        <Input
          type="password"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          required
          minLength={6}
        />
      </Field>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "..." : "Alterar"}
        </Button>
      </div>
    </form>
  );
}
