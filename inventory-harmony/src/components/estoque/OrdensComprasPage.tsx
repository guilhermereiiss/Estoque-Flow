import * as React from "react";
import { useApi, useAuth } from "@/lib/auth-context";
import { fmtBRL, fmtDate, fmtNum } from "@/lib/format";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  Table,
  Th,
  Td,
  Pagination,
  StatusBadge,
  LoadingSpinner,
} from "@/components/estoque/ui-kit";
import { Plus, Eye, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const NEXT_STATUS: Record<string, string[]> = {
  rascunho: ["enviada", "cancelada"],
  enviada: ["aprovada", "cancelada"],
  aprovada: ["recebida", "cancelada"],
  recebida: [],
  cancelada: [],
};

export default function OrdensComprasPage() {
  const api = useApi();
  const { user } = useAuth();
  const canWrite = user?.perfil === "admin" || user?.perfil === "gerente";

  const [pagina, setPagina] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [fornecedorId, setFornecedorId] = React.useState("");
  const [data, setData] = React.useState<{ dados: any[]; paginacao?: any }>({ dados: [] });
  const [loading, setLoading] = React.useState(false);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [produtos, setProdutos] = React.useState<any[]>([]);

  const [novaOpen, setNovaOpen] = React.useState(false);
  const [verOrdem, setVerOrdem] = React.useState<any | null>(null);
  const [statusOrdem, setStatusOrdem] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        pagina: String(pagina),
        limite: String(PAGE_SIZE),
        ...(status ? { status } : {}),
        ...(fornecedorId ? { fornecedor_id: fornecedorId } : {}),
      });
      const r = await api<any>(`/ordens-compra?${qs}`);
      setData(r);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }, [api, pagina, status, fornecedorId]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    (async () => {
      try {
        const [f, p] = await Promise.all([
          api<any>(`/fornecedores?limite=200&ativo=true`),
          api<any>(`/produtos?limite=500&ativo=true`),
        ]);
        setFornecedores(f?.dados || []);
        setProdutos(p?.dados || []);
      } catch {
        /* noop */
      }
    })();
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Status" className="flex-1 sm:flex-initial">
          <Select
            value={status}
            onChange={(e) => {
              setPagina(1);
              setStatus(e.target.value);
            }}
            className="w-full sm:w-40"
          >
            <option value="">Todos</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviada">Enviada</option>
            <option value="aprovada">Aprovada</option>
            <option value="recebida">Recebida</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </Field>
        <Field label="Fornecedor" className="flex-1 sm:flex-initial">
          <Select
            value={fornecedorId}
            onChange={(e) => {
              setPagina(1);
              setFornecedorId(e.target.value);
            }}
            className="w-full sm:w-56"
          >
            <option value="">Todos</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        </Field>
        <div className="ml-auto" />
        {canWrite && (
          <Button onClick={() => setNovaOpen(true)}>
            <Plus className="size-4" /> Nova Ordem
          </Button>
        )}
      </div>

      <Table
        loading={loading}
        empty={data.dados.length === 0}
        head={
          <>
            <Th>ID</Th>
            <Th>Fornecedor</Th>
            <Th>Criada</Th>
            <Th>Previsão</Th>
            <Th>Status</Th>
            <Th className="text-right">Total</Th>
            <Th className="text-right">Ações</Th>
          </>
        }
      >
        {data.dados.map((o: any) => (
          <tr key={o.id}>
            <Td className="font-mono text-xs">#{String(o.id).slice(0, 8)}</Td>
            <Td>{o.fornecedor_nome}</Td>
            <Td className="font-mono text-xs">{fmtDate(o.criado_em)}</Td>
            <Td className="font-mono text-xs">{fmtDate(o.data_prevista)}</Td>
            <Td>
              <StatusBadge status={o.status} />
            </Td>
            <Td className="text-right font-mono">{fmtBRL(o.valor_total)}</Td>
            <Td className="text-right">
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => setVerOrdem(o)}
                  className="grid size-7 place-items-center rounded border border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Ver"
                >
                  <Eye className="size-3.5" />
                </button>
                {canWrite && NEXT_STATUS[o.status]?.length > 0 && (
                  <button
                    onClick={() => setStatusOrdem(o)}
                    className="grid size-7 place-items-center rounded border border-border bg-surface text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Alterar status"
                  >
                    <RefreshCw className="size-3.5" />
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

      {novaOpen && (
        <NovaOrdemModal
          fornecedores={fornecedores}
          produtos={produtos}
          onClose={() => setNovaOpen(false)}
          onSaved={() => {
            setNovaOpen(false);
            load();
          }}
        />
      )}

      {verOrdem && <DetalheOrdemModal ordem={verOrdem} onClose={() => setVerOrdem(null)} />}

      {statusOrdem && (
        <AlterarStatusModal
          ordem={statusOrdem}
          onClose={() => setStatusOrdem(null)}
          onSaved={() => {
            setStatusOrdem(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function NovaOrdemModal({
  fornecedores,
  produtos,
  onClose,
  onSaved,
}: {
  fornecedores: any[];
  produtos: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useApi();
  const [fornecedorId, setFornecedorId] = React.useState("");
  const [dataPrevista, setDataPrevista] = React.useState("");
  const [observacoes, setObservacoes] = React.useState("");
  const [itens, setItens] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);

  const total = itens.reduce(
    (s, i) => s + Number(i.quantidade || 0) * Number(i.preco_unitario || 0),
    0,
  );

  const addItem = () =>
    setItens((p) => [...p, { produto_id: "", quantidade: 1, preco_unitario: 0 }]);
  const updItem = (i: number, patch: any) =>
    setItens((p) => p.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const rmItem = (i: number) => setItens((p) => p.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0) {
      toast.error("Adicione ao menos um item");
      return;
    }
    setSaving(true);
    try {
      await api(`/ordens-compra`, {
        method: "POST",
        body: JSON.stringify({
          fornecedor_id: fornecedorId,
          observacoes,
          data_prevista: dataPrevista || null,
          itens: itens.map((i) => ({
            produto_id: i.produto_id,
            quantidade: Number(i.quantidade),
            preco_unitario: Number(i.preco_unitario),
          })),
        }),
      });
      toast.success("Ordem criada");
      onSaved();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Nova Ordem de Compra" size="xl">
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Fornecedor">
            <Select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} required>
              <option value="">Selecione...</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Previsão de entrega">
            <Input
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
            />
          </Field>
          <Field label="Observações">
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-display text-sm">Itens</h4>
            <Button type="button" size="sm" variant="secondary" onClick={addItem}>
              <Plus className="size-3" /> Adicionar item
            </Button>
          </div>
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Produto</Th>
                  <Th className="w-32 text-right">Qtd</Th>
                  <Th className="w-36 text-right">Preço Unit.</Th>
                  <Th className="w-32 text-right">Subtotal</Th>
                  <Th className="w-12"></Th>
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-center text-muted-foreground">
                      Sem itens
                    </Td>
                  </tr>
                ) : (
                  itens.map((it, i) => {
                    const sub = Number(it.quantidade || 0) * Number(it.preco_unitario || 0);
                    return (
                      <tr key={i}>
                        <Td>
                          <Select
                            value={it.produto_id}
                            onChange={(e) => updItem(i, { produto_id: e.target.value })}
                            required
                          >
                            <option value="">Selecione...</option>
                            {produtos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo} — {p.nome}
                              </option>
                            ))}
                          </Select>
                        </Td>
                        <Td>
                          <Input
                            type="number"
                            step="0.001"
                            value={it.quantidade}
                            onChange={(e) => updItem(i, { quantidade: e.target.value })}
                            className="text-right"
                          />
                        </Td>
                        <Td>
                          <Input
                            type="number"
                            step="0.01"
                            value={it.preco_unitario}
                            onChange={(e) => updItem(i, { preco_unitario: e.target.value })}
                            className="text-right"
                          />
                        </Td>
                        <Td className="text-right font-mono">{fmtBRL(sub)}</Td>
                        <Td>
                          <button
                            type="button"
                            onClick={() => rmItem(i)}
                            className="grid size-7 place-items-center rounded border border-border text-destructive hover:bg-accent"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-surface">
                  <Td colSpan={3} className="text-right font-mono text-xs uppercase text-muted-foreground">
                    Total
                  </Td>
                  <Td className="text-right font-display text-base">{fmtBRL(total)}</Td>
                  <Td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Criar Ordem"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DetalheOrdemModal({ ordem, onClose }: { ordem: any; onClose: () => void }) {
  const api = useApi();
  const [det, setDet] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await api<any>(`/ordens-compra/${ordem.id}`);
        setDet(r);
      } catch (err: any) {
        toast.error(typeof err === "string" ? err : err?.message || "Erro");
      } finally {
        setLoading(false);
      }
    })();
  }, [api, ordem.id]);

  return (
    <Modal open onClose={onClose} title={`Ordem #${String(ordem.id).slice(0, 8)}`} size="lg">
      {loading || !det ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <Info label="Fornecedor" value={det.fornecedor_nome} />
            <Info label="Status" value={<StatusBadge status={det.status} />} />
            <Info label="Total" value={<span className="font-mono">{fmtBRL(det.valor_total)}</span>} />
            <Info label="Criada" value={fmtDate(det.criado_em)} />
            <Info label="Previsão" value={fmtDate(det.data_prevista)} />
            <Info label="Usuário" value={det.usuario_nome || "—"} />
          </div>
          {det.observacoes && (
            <div className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
              {det.observacoes}
            </div>
          )}
          <Table
            empty={!det.itens || det.itens.length === 0}
            head={
              <>
                <Th>Código</Th>
                <Th>Produto</Th>
                <Th className="text-right">Qtd</Th>
                <Th className="text-right">Preço Unit.</Th>
                <Th className="text-right">Subtotal</Th>
              </>
            }
          >
            {(det.itens || []).map((it: any, i: number) => (
              <tr key={i}>
                <Td className="font-mono text-xs">{it.produto_codigo}</Td>
                <Td>{it.produto_nome}</Td>
                <Td className="text-right font-mono">{fmtNum(it.quantidade, 3)}</Td>
                <Td className="text-right font-mono">{fmtBRL(it.preco_unitario)}</Td>
                <Td className="text-right font-mono">{fmtBRL(it.subtotal)}</Td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function AlterarStatusModal({
  ordem,
  onClose,
  onSaved,
}: {
  ordem: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useApi();
  const opts = NEXT_STATUS[ordem.status] || [];
  const [novo, setNovo] = React.useState(opts[0] || "");
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    if (!novo) return;
    setSaving(true);
    try {
      await api(`/ordens-compra/${ordem.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: novo }),
      });
      toast.success("Status atualizado");
      onSaved();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Alterar status da ordem" size="sm">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          De <StatusBadge status={ordem.status} /> para
          <Select value={novo} onChange={(e) => setNovo(e.target.value)} className="w-40">
            {opts.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        {novo === "recebida" && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
            ⚠ Isso registrará entradas no estoque automaticamente para todos os itens da ordem.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving || !novo}>
            {saving ? "..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
