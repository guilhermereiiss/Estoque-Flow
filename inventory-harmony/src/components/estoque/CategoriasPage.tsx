import * as React from "react";
import { useApi, useAuth } from "@/lib/auth-context";
import {
  Button,
  Field,
  Input,
  Textarea,
  Modal,
  ConfirmDialog,
  EmptyState,
  LoadingSpinner,
} from "@/components/estoque/ui-kit";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";

export default function CategoriasPage() {
  const api = useApi();
  const { user } = useAuth();
  const canWrite = user?.perfil === "admin" || user?.perfil === "gerente";
  const canDelete = user?.perfil === "admin";

  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [confirmDel, setConfirmDel] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<any[]>(`/categorias`);
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

  const onDelete = async (c: any) => {
    try {
      await api(`/categorias/${c.id}`, { method: "DELETE" });
      toast.success("Categoria removida");
      setConfirmDel(null);
      load();
    } catch (err: any) {
      const msg =
        err?.status === 409
          ? "Categoria está em uso e não pode ser removida"
          : typeof err === "string"
            ? err
            : err?.message || "Erro";
      toast.error(msg);
      setConfirmDel(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" /> Nova Categoria
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon={Tags} title="Sem categorias" description="Crie a primeira categoria" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-sm">{c.nome}</h3>
                  {c.descricao && (
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {c.descricao}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {canWrite && (
                    <button
                      onClick={() => {
                        setEditing(c);
                        setModalOpen(true);
                      }}
                      className="grid size-6 place-items-center rounded border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="size-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setConfirmDel(c)}
                      className="grid size-6 place-items-center rounded border border-border text-destructive hover:bg-accent"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Produtos
                </span>
                <span className="font-display text-base">{c.total_produtos ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <CategoriaModal
          categoria={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title="Remover categoria?"
        message={`Confirmar remoção de "${confirmDel?.nome}"?`}
        variant="destructive"
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => confirmDel && onDelete(confirmDel)}
      />
    </div>
  );
}

function CategoriaModal({
  categoria,
  onClose,
  onSaved,
}: {
  categoria: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useApi();
  const [nome, setNome] = React.useState(categoria?.nome || "");
  const [descricao, setDescricao] = React.useState(categoria?.descricao || "");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (categoria) {
        await api(`/categorias/${categoria.id}`, {
          method: "PUT",
          body: JSON.stringify({ nome, descricao }),
        });
        toast.success("Categoria atualizada");
      } else {
        await api(`/categorias`, { method: "POST", body: JSON.stringify({ nome, descricao }) });
        toast.success("Categoria criada");
      }
      onSaved();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={categoria ? "Editar Categoria" : "Nova Categoria"}>
      <form className="space-y-3" onSubmit={submit}>
        <Field label="Nome">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
        </Field>
        <Field label="Descrição">
          <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
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
