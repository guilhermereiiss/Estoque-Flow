import * as React from "react";
import { useApi, useAuth } from "@/lib/auth-context";
import { fmtBRL, fmtNum, fmtDateTime } from "@/lib/format";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  ConfirmDialog,
  Table,
  Th,
  Td,
  Pagination,
  SearchInput,
  SituacaoBadge,
  MovTipoBadge,
  LoadingSpinner,
} from "@/components/estoque/ui-kit";
import { Plus, Pencil, History, ArrowLeftRight, Power } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type Produto = any;

export default function ProdutosPage() {
  const api = useApi();
  const { user } = useAuth();
  const canWrite = user?.perfil === "admin" || user?.perfil === "gerente";
  const canDelete = user?.perfil === "admin";

  const [pagina, setPagina] = React.useState(1);
  const [busca, setBusca] = React.useState("");
  const [categoriaId, setCategoriaId] = React.useState("");
  const [situacao, setSituacao] = React.useState("");
  const [data, setData] = React.useState<{ dados: Produto[]; paginacao?: any }>({ dados: [] });
  const [loading, setLoading] = React.useState(false);
  const [categorias, setCategorias] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Produto | null>(null);
  const [movProduto, setMovProduto] = React.useState<Produto | null>(null);
  const [histProduto, setHistProduto] = React.useState<Produto | null>(null);
  const [confirmDeact, setConfirmDeact] = React.useState<Produto | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        pagina: String(pagina),
        limite: String(PAGE_SIZE),
        ...(busca ? { busca } : {}),
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
        ...(situacao ? { situacao } : {}),
      });
      const r = await api<any>(`/produtos?${qs}`);
      setData(r);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [api, pagina, busca, categoriaId, situacao]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    (async () => {
      try {
        const [cats, forns] = await Promise.all([
          api<any[]>("/categorias"),
          api<any>("/fornecedores?limite=200"),
        ]);
        setCategorias(Array.isArray(cats) ? cats : []);
        setFornecedores(forns?.dados || []);
      } catch {
        /* noop */
      }
    })();
  }, [api]);

  const onDeactivate = async (p: Produto) => {
    try {
      await api(`/produtos/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...p, ativo: false }),
      });
      toast.success("Produto desativado");
      setConfirmDeact(null);
      load();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro ao desativar");
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
          className="w-full sm:w-64"
          placeholder="Buscar por nome ou código..."
        />
        <Select
          value={categoriaId}
          onChange={(e) => {
            setPagina(1);
            setCategoriaId(e.target.value);
          }}
          className="w-full sm:w-48"
        >
          <option value="">Todas categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
        <Select
          value={situacao}
          onChange={(e) => {
            setPagina(1);
            setSituacao(e.target.value);
          }}
          className="w-full sm:w-40"
        >
          <option value="">Toda situação</option>
          <option value="normal">Normal</option>
          <option value="critico">Crítico</option>
          <option value="zerado">Zerado</option>
          <option value="excesso">Excesso</option>
        </Select>
        <div className="ml-auto" />
        {canWrite && (
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" /> Novo Produto
          </Button>
        )}
      </div>

      <Table
        loading={loading}
        empty={data.dados.length === 0}
        head={
          <>
            <Th>Código</Th>
            <Th>Nome</Th>
            <Th>Categoria</Th>
            <Th className="text-right">Estoque</Th>
            <Th className="text-right">Mín / Máx</Th>
            <Th>Situação</Th>
            <Th className="text-right">Preço venda</Th>
            <Th className="text-right">Ações</Th>
          </>
        }
      >
        {data.dados.map((p) => {
          const cat = categorias.find((c) => c.id === p.categoria_id);
          return (
            <tr key={p.id}>
              <Td className="font-mono text-xs">{p.codigo}</Td>
              <Td>
                <div className="font-medium">{p.nome}</div>
                {!p.ativo && (
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">
                    inativo
                  </div>
                )}
              </Td>
              <Td className="text-muted-foreground">{cat?.nome || "—"}</Td>
              <Td className="text-right font-mono">{fmtNum(p.estoque_atual, 3)}</Td>
              <Td className="text-right font-mono text-muted-foreground">
                {fmtNum(p.estoque_minimo, 3)} / {fmtNum(p.estoque_maximo, 3)}
              </Td>
              <Td>
                <SituacaoBadge value={p.situacao} />
              </Td>
              <Td className="text-right font-mono">{fmtBRL(p.preco_venda)}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <IconBtn title="Histórico" onClick={() => setHistProduto(p)}>
                    <History className="size-3.5" />
                  </IconBtn>
                  {canWrite && (
                    <IconBtn title="Movimentar" onClick={() => setMovProduto(p)}>
                      <ArrowLeftRight className="size-3.5" />
                    </IconBtn>
                  )}
                  {canWrite && (
                    <IconBtn
                      title="Editar"
                      onClick={() => {
                        setEditing(p);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </IconBtn>
                  )}
                  {canDelete && p.ativo && (
                    <IconBtn title="Desativar" onClick={() => setConfirmDeact(p)}>
                      <Power className="size-3.5 text-destructive" />
                    </IconBtn>
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </Table>

      <Pagination
        pagina={data.paginacao?.pagina || pagina}
        paginas={data.paginacao?.paginas || 1}
        onChange={setPagina}
      />

      {modalOpen && (
        <ProdutoModal
          produto={editing}
          categorias={categorias}
          fornecedores={fornecedores}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}

      {movProduto && (
        <MovimentarModal
          produto={movProduto}
          fornecedores={fornecedores}
          onClose={() => setMovProduto(null)}
          onDone={() => {
            setMovProduto(null);
            load();
          }}
        />
      )}

      {histProduto && (
        <HistoricoModal produto={histProduto} onClose={() => setHistProduto(null)} />
      )}

      <ConfirmDialog
        open={!!confirmDeact}
        title="Desativar produto?"
        message={`Deseja desativar "${confirmDeact?.nome}"?`}
        variant="destructive"
        onCancel={() => setConfirmDeact(null)}
        onConfirm={() => confirmDeact && onDeactivate(confirmDeact)}
      />
    </div>
  );
}

function IconBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="grid size-7 place-items-center rounded border border-border bg-surface text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      {...props}
    >
      {children}
    </button>
  );
}

function ProdutoModal({
  produto,
  categorias,
  fornecedores,
  onClose,
  onSaved,
}: {
  produto: Produto | null;
  categorias: any[];
  fornecedores: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useApi();
  const [form, setForm] = React.useState<any>(
    produto || {
      codigo: "",
      nome: "",
      descricao: "",
      categoria_id: "",
      fornecedor_id: "",
      preco_custo: 0,
      preco_venda: 0,
      unidade_medida: "UN",
      estoque_minimo: 0,
      estoque_maximo: 0,
      ativo: true,
    },
  );
  const [saving, setSaving] = React.useState(false);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        codigo: form.codigo,
        nome: form.nome,
        descricao: form.descricao,
        categoria_id: form.categoria_id || null,
        fornecedor_id: form.fornecedor_id || null,
        preco_custo: Number(form.preco_custo) || 0,
        preco_venda: Number(form.preco_venda) || 0,
        unidade_medida: form.unidade_medida,
        estoque_minimo: Number(form.estoque_minimo) || 0,
        estoque_maximo: Number(form.estoque_maximo) || 0,
        ...(produto ? { ativo: form.ativo } : {}),
      };
      if (produto) {
        await api(`/produtos/${produto.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success("Produto atualizado");
      } else {
        await api(`/produtos`, { method: "POST", body: JSON.stringify(body) });
        toast.success("Produto criado");
      }
      onSaved();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={produto ? "Editar Produto" : "Novo Produto"} size="lg">
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Código">
          <Input value={form.codigo} onChange={(e) => set("codigo", e.target.value)} required />
        </Field>
        <Field label="Unidade">
          <Input
            value={form.unidade_medida}
            onChange={(e) => set("unidade_medida", e.target.value)}
            required
          />
        </Field>
        <Field label="Nome" className="col-span-2">
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
        </Field>
        <Field label="Descrição" className="col-span-2">
          <Textarea
            value={form.descricao || ""}
            onChange={(e) => set("descricao", e.target.value)}
          />
        </Field>
        <Field label="Categoria">
          <Select
            value={form.categoria_id || ""}
            onChange={(e) => set("categoria_id", e.target.value)}
          >
            <option value="">—</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fornecedor">
          <Select
            value={form.fornecedor_id || ""}
            onChange={(e) => set("fornecedor_id", e.target.value)}
          >
            <option value="">—</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Preço de custo">
          <Input
            type="number"
            step="0.01"
            value={form.preco_custo}
            onChange={(e) => set("preco_custo", e.target.value)}
          />
        </Field>
        <Field label="Preço de venda">
          <Input
            type="number"
            step="0.01"
            value={form.preco_venda}
            onChange={(e) => set("preco_venda", e.target.value)}
          />
        </Field>
        <Field label="Estoque mínimo">
          <Input
            type="number"
            step="0.001"
            value={form.estoque_minimo}
            onChange={(e) => set("estoque_minimo", e.target.value)}
          />
        </Field>
        <Field label="Estoque máximo">
          <Input
            type="number"
            step="0.001"
            value={form.estoque_maximo}
            onChange={(e) => set("estoque_maximo", e.target.value)}
          />
        </Field>
        {produto && (
          <Field label="Ativo" className="col-span-2">
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
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MovimentarModal({
  produto,
  fornecedores,
  onClose,
  onDone,
}: {
  produto: Produto;
  fornecedores: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const api = useApi();
  const [tipo, setTipo] = React.useState<"entrada" | "saida">("entrada");
  const [qtd, setQtd] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [referencia, setReferencia] = React.useState("");
  const [fornecedorId, setFornecedorId] = React.useState("");
  const [precoUnit, setPrecoUnit] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tipo === "entrada") {
        await api(`/movimentacoes/entrada`, {
          method: "POST",
          body: JSON.stringify({
            produto_id: produto.id,
            quantidade: Number(qtd),
            motivo,
            referencia,
            fornecedor_id: fornecedorId || null,
            preco_unitario: precoUnit ? Number(precoUnit) : undefined,
          }),
        });
      } else {
        await api(`/movimentacoes/saida`, {
          method: "POST",
          body: JSON.stringify({
            produto_id: produto.id,
            quantidade: Number(qtd),
            motivo,
            referencia,
          }),
        });
      }
      toast.success("Movimentação registrada");
      onDone();
    } catch (err: any) {
      const msg =
        err?.payload?.disponivel !== undefined
          ? `Estoque insuficiente. Disponível: ${err.payload.disponivel}`
          : typeof err === "string"
            ? err
            : err?.message || "Erro";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Movimentar — ${produto.nome}`} size="md">
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        Estoque atual:{" "}
        <span className="font-display text-foreground">{fmtNum(produto.estoque_atual, 3)}</span>{" "}
        {produto.unidade_medida}
      </p>
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-md border border-border bg-surface p-1 font-mono text-xs">
        <button
          type="button"
          onClick={() => setTipo("entrada")}
          className={`rounded py-1.5 uppercase ${tipo === "entrada" ? "bg-success/20 text-success" : "text-muted-foreground"}`}
        >
          Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo("saida")}
          className={`rounded py-1.5 uppercase ${tipo === "saida" ? "bg-destructive/20 text-destructive" : "text-muted-foreground"}`}
        >
          Saída
        </button>
      </div>
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Quantidade">
          <Input
            type="number"
            step="0.001"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            required
          />
        </Field>
        {tipo === "entrada" && (
          <Field label="Preço unitário">
            <Input
              type="number"
              step="0.01"
              value={precoUnit}
              onChange={(e) => setPrecoUnit(e.target.value)}
            />
          </Field>
        )}
        {tipo === "entrada" && (
          <Field label="Fornecedor" className="col-span-2">
            <Select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
              <option value="">—</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Motivo" className="col-span-2">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
        </Field>
        <Field label="Referência" className="col-span-2">
          <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </Field>
        <div className="col-span-2 mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Registrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function HistoricoModal({ produto, onClose }: { produto: Produto; onClose: () => void }) {
  const api = useApi();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api<any>(`/produtos/${produto.id}/historico`);
        setItems(Array.isArray(r) ? r : r?.dados || []);
      } catch (err: any) {
        toast.error(typeof err === "string" ? err : err?.message || "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, produto.id]);
  return (
    <Modal open onClose={onClose} title={`Histórico — ${produto.nome}`} size="lg">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table
          empty={items.length === 0}
          head={
            <>
              <Th>Data</Th>
              <Th>Tipo</Th>
              <Th className="text-right">Qtd</Th>
              <Th className="text-right">Anterior → Posterior</Th>
              <Th>Motivo</Th>
              <Th>Usuário</Th>
            </>
          }
        >
          {items.map((m: any, i: number) => (
            <tr key={m.id || i}>
              <Td className="whitespace-nowrap font-mono text-xs">{fmtDateTime(m.criado_em)}</Td>
              <Td>
                <MovTipoBadge tipo={m.tipo} />
              </Td>
              <Td className="text-right font-mono">{fmtNum(m.quantidade, 3)}</Td>
              <Td className="text-right font-mono text-muted-foreground">
                {fmtNum(m.quantidade_anterior, 3)} → {fmtNum(m.quantidade_posterior, 3)}
              </Td>
              <Td>{m.motivo}</Td>
              <Td className="text-muted-foreground">{m.usuario_nome || "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Modal>
  );
}
