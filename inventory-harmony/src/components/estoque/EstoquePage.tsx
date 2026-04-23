import * as React from "react";
import { useApi, useAuth } from "@/lib/auth-context";
import { fmtBRL, fmtNum, fmtDate } from "@/lib/format";
import {
  Button,
  Field,
  Input,
  Select,
  Modal,
  Table,
  Th,
  Td,
  Pagination,
  SearchInput,
} from "@/components/estoque/ui-kit";
import { Sliders, Package, Coins, AlertTriangle, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function EstoquePage() {
  const api = useApi();
  const { user } = useAuth();
  const canWrite = user?.perfil === "admin" || user?.perfil === "gerente";

  const [pagina, setPagina] = React.useState(1);
  const [busca, setBusca] = React.useState("");
  const [data, setData] = React.useState<{ dados: any[]; paginacao?: any }>({ dados: [] });
  const [resumo, setResumo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [ajusteOpen, setAjusteOpen] = React.useState(false);
  const [produtos, setProdutos] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        pagina: String(pagina),
        limite: String(PAGE_SIZE),
        ...(busca ? { busca } : {}),
      });
      const [r, res] = await Promise.all([
        api<any>(`/estoque?${qs}`),
        api<any>(`/estoque/resumo`),
      ]);
      setData(r);
      setResumo(res);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  }, [api, pagina, busca]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await api<any>(`/produtos?limite=500&ativo=true`);
        setProdutos(r?.dados || []);
      } catch {
        /* noop */
      }
    })();
  }, [api]);

  return (
    <div className="space-y-4">
      {resumo && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniCard icon={Package} label="Itens em estoque" value={fmtNum(resumo.total_itens, 3)} />
          <MiniCard
            icon={Coins}
            label="Valor (custo)"
            value={fmtBRL(resumo.valor_total_custo)}
          />
          <MiniCard
            icon={AlertTriangle}
            label="Abaixo do mínimo"
            value={fmtNum(resumo.produtos_abaixo_minimo)}
            tone="warning"
          />
          <MiniCard
            icon={AlertOctagon}
            label="Zerados"
            value={fmtNum(resumo.produtos_zerados)}
            tone="destructive"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={busca}
          onChange={(v) => {
            setPagina(1);
            setBusca(v);
          }}
          className="w-full sm:w-64"
          placeholder="Buscar produto..."
        />
        <div className="ml-auto" />
        {canWrite && (
          <Button onClick={() => setAjusteOpen(true)}>
            <Sliders className="size-4" /> Ajustar Estoque
          </Button>
        )}
      </div>

      <Table
        loading={loading}
        empty={data.dados.length === 0}
        head={
          <>
            <Th>Produto</Th>
            <Th>Código</Th>
            <Th className="text-right">Qtd</Th>
            <Th>Localização</Th>
            <Th>Lote</Th>
            <Th>Validade</Th>
            <Th className="text-right">Valor (venda)</Th>
          </>
        }
      >
        {data.dados.map((e: any, i: number) => (
          <tr key={i} className={e.alerta_minimo ? "bg-warning/5" : undefined}>
            <Td>{e.produto_nome}</Td>
            <Td className="font-mono text-xs">{e.produto_codigo}</Td>
            <Td className="text-right font-mono">
              {fmtNum(e.quantidade, 3)}
              {e.alerta_minimo && (
                <span className="ml-1.5 font-mono text-[10px] uppercase text-warning">⚠</span>
              )}
            </Td>
            <Td className="text-muted-foreground">{e.localizacao || "—"}</Td>
            <Td className="font-mono text-xs">{e.lote || "—"}</Td>
            <Td className="font-mono text-xs">{fmtDate(e.data_validade)}</Td>
            <Td className="text-right font-mono">{fmtBRL(e.valor_total_venda)}</Td>
          </tr>
        ))}
      </Table>

      <Pagination
        pagina={data.paginacao?.pagina || pagina}
        paginas={data.paginacao?.paginas || 1}
        onChange={setPagina}
      />

      {ajusteOpen && (
        <AjusteModal
          produtos={produtos}
          onClose={() => setAjusteOpen(false)}
          onDone={() => {
            setAjusteOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warning" | "destructive";
}) {
  const c =
    tone === "warning"
      ? "text-warning"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className={`size-4 ${c}`} />
      </div>
      <p className={`mt-1.5 font-display text-lg ${c}`}>{value}</p>
    </div>
  );
}

function AjusteModal({
  produtos,
  onClose,
  onDone,
}: {
  produtos: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const api = useApi();
  const [produtoId, setProdutoId] = React.useState("");
  const [novaQtd, setNovaQtd] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const sel = produtos.find((p) => p.id === produtoId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/estoque/ajuste`, {
        method: "POST",
        body: JSON.stringify({
          produto_id: produtoId,
          nova_quantidade: Number(novaQtd),
          motivo,
        }),
      });
      toast.success("Ajuste registrado");
      onDone();
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Ajustar Estoque" size="md">
      <form className="space-y-3" onSubmit={submit}>
        <Field label="Produto">
          <Select value={produtoId} onChange={(e) => setProdutoId(e.target.value)} required>
            <option value="">Selecione...</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} — {p.nome}
              </option>
            ))}
          </Select>
        </Field>
        {sel && (
          <p className="font-mono text-xs text-muted-foreground">
            Estoque atual: <span className="text-foreground">{fmtNum(sel.estoque_atual, 3)}</span>{" "}
            {sel.unidade_medida}
          </p>
        )}
        <Field label="Nova quantidade">
          <Input
            type="number"
            step="0.001"
            value={novaQtd}
            onChange={(e) => setNovaQtd(e.target.value)}
            required
          />
        </Field>
        <Field label="Motivo">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Ajustar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
