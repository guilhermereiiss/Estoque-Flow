import * as React from "react";
import { useApi, useAuth } from "@/lib/auth-context";
import { fmtNum } from "@/lib/format";
import {
  Button,
  Field,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  Table,
  Th,
  Td,
  Pagination,
  SearchInput,
  LoadingSpinner,
} from "@/components/estoque/ui-kit";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function FornecedoresPage() {
  const api = useApi();
  const { user } = useAuth();
  const canWrite = user?.perfil === "admin" || user?.perfil === "gerente";
  const canDelete = user?.perfil === "admin";

  const [pagina, setPagina] = React.useState(1);
  const [busca, setBusca] = React.useState("");
  const [data, setData] = React.useState<{ dados: any[]; paginacao?: any }>({ dados: [] });
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [verProdutos, setVerProdutos] = React.useState<any | null>(null);
  const [confirmDel, setConfirmDel] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        pagina: String(pagina),
        limite: String(PAGE_SIZE),
        ...(busca ? { busca } : {}),
      });
      const r = await api<any>(`/fornecedores?${qs}`);
      setData(r);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }, [api, pagina, busca]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (f: any) => {
    try {
      await api(`/fornecedores/${f.id}`, { method: "DELETE" });
      toast.success("Fornecedor removido");
      setConfirmDel(null);
      load();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={busca}
          onChange={(v) => {
            setPagina(1);
            setBusca(v);
          }}
          className="w-full sm:w-72"
          placeholder="Buscar fornecedor..."
        />
        <div className="ml-auto" />
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" /> Novo Fornecedor
          </Button>
        )}
      </div>

      <Table
        loading={loading}
        empty={data.dados.length === 0}
        head={
          <>
            <Th>Nome</Th>
            <Th>CNPJ</Th>
            <Th>Email</Th>
            <Th>Telefone</Th>
            <Th>Cidade/UF</Th>
            <Th>Status</Th>
            <Th className="text-right">Ações</Th>
          </>
        }
      >
        {data.dados.map((f: any) => (
          <tr key={f.id}>
            <Td>
              <div className="font-medium">{f.nome}</div>
              {f.contato_nome && (
                <div className="text-xs text-muted-foreground">{f.contato_nome}</div>
              )}
            </Td>
            <Td className="font-mono text-xs">{f.cnpj || "—"}</Td>
            <Td className="text-muted-foreground">{f.email || "—"}</Td>
            <Td className="font-mono text-xs">{f.telefone || "—"}</Td>
            <Td className="text-muted-foreground">
              {f.cidade || "—"}/{f.estado || "—"}
            </Td>
            <Td>
              <span
                className={`font-mono text-[10px] uppercase ${f.ativo ? "text-success" : "text-destructive"}`}
              >
                {f.ativo ? "ativo" : "inativo"}
              </span>
            </Td>
            <Td className="text-right">
              <div className="flex justify-end gap-1">
                <button
                  title="Ver produtos"
                  onClick={() => setVerProdutos(f)}
                  className="grid size-7 place-items-center rounded border border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Package className="size-3.5" />
                </button>
                {canWrite && (
                  <button
                    title="Editar"
                    onClick={() => {
                      setEditing(f);
                      setModalOpen(true);
                    }}
                    className="grid size-7 place-items-center rounded border border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                {canDelete && f.ativo && (
                  <button
                    title="Remover"
                    onClick={() => setConfirmDel(f)}
                    className="grid size-7 place-items-center rounded border border-border bg-surface text-destructive hover:bg-accent"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </Table>

      <Pagination
        pagina={data.paginacao?.pagina || pagina}
        paginas={data.paginacao?.paginas || 1}
        onChange={setPagina}
      />

      {modalOpen && (
        <FornecedorModal
          fornecedor={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}

      {verProdutos && (
        <ProdutosFornecedorModal
          fornecedor={verProdutos}
          onClose={() => setVerProdutos(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title="Remover fornecedor?"
        message={`Confirmar remoção de "${confirmDel?.nome}"?`}
        variant="destructive"
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && onDelete(confirmDel)}
      />
    </div>
  );
}

function FornecedorModal({
  fornecedor,
  onClose,
  onSaved,
}: {
  fornecedor: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useApi();
  const [form, setForm] = React.useState<any>(
    fornecedor || {
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      contato_nome: "",
      ativo: true,
    },
  );
  const [saving, setSaving] = React.useState(false);
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (fornecedor) {
        await api(`/fornecedores/${fornecedor.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Fornecedor atualizado");
      } else {
        delete body.ativo;
        await api(`/fornecedores`, { method: "POST", body: JSON.stringify(body) });
        toast.success("Fornecedor criado");
      }
      onSaved();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"} size="lg">
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Nome" className="col-span-2">
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
        </Field>
        <Field label="CNPJ">
          <Input value={form.cnpj || ""} onChange={(e) => set("cnpj", e.target.value)} />
        </Field>
        <Field label="Contato">
          <Input
            value={form.contato_nome || ""}
            onChange={(e) => set("contato_nome", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email || ""}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Telefone">
          <Input value={form.telefone || ""} onChange={(e) => set("telefone", e.target.value)} />
        </Field>
        <Field label="Endereço" className="col-span-2">
          <Input value={form.endereco || ""} onChange={(e) => set("endereco", e.target.value)} />
        </Field>
        <Field label="Cidade">
          <Input value={form.cidade || ""} onChange={(e) => set("cidade", e.target.value)} />
        </Field>
        <Field label="Estado">
          <Input
            value={form.estado || ""}
            maxLength={2}
            onChange={(e) => set("estado", e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="CEP">
          <Input value={form.cep || ""} onChange={(e) => set("cep", e.target.value)} />
        </Field>
        {fornecedor && (
          <Field label="Status">
            <Select
              value={form.ativo ? "1" : "0"}
              onChange={(e) => set("ativo", e.target.value === "1")}
            >
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </Select>
          </Field>
        )}
        <div className="col-span-2 mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ProdutosFornecedorModal({
  fornecedor,
  onClose,
}: {
  fornecedor: any;
  onClose: () => void;
}) {
  const api = useApi();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api<any>(`/fornecedores/${fornecedor.id}/produtos`);
        setItems(Array.isArray(r) ? r : r?.dados || []);
      } catch (err: any) {
        toast.error(typeof err === "string" ? err : err?.message || "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, fornecedor.id]);

  return (
    <Modal open onClose={onClose} title={`Produtos — ${fornecedor.nome}`} size="lg">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table
          empty={items.length === 0}
          head={
            <>
              <Th>Código</Th>
              <Th>Nome</Th>
              <Th className="text-right">Estoque</Th>
            </>
          }
        >
          {items.map((p: any) => (
            <tr key={p.id}>
              <Td className="font-mono text-xs">{p.codigo}</Td>
              <Td>{p.nome}</Td>
              <Td className="text-right font-mono">{fmtNum(p.estoque_atual, 3)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}
