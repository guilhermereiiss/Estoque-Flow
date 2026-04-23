import * as React from "react";
import { useApi, useAuth } from "@/lib/auth-context";
import { fmtNum, fmtDateTime } from "@/lib/format";
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
  MovTipoBadge,
} from "@/components/estoque/ui-kit";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function MovimentacoesPage() {
  const api = useApi();
  const { user } = useAuth();
  const canWrite = !!user; // todos podem registrar (a API valida)

  const [pagina, setPagina] = React.useState(1);
  const [tipo, setTipo] = React.useState("");
  const [produtoId, setProdutoId] = React.useState("");
  const [dataInicio, setDataInicio] = React.useState("");
  const [dataFim, setDataFim] = React.useState("");
  const [data, setData] = React.useState<{ dados: any[]; paginacao?: any }>({ dados: [] });
  const [loading, setLoading] = React.useState(false);
  const [produtos, setProdutos] = React.useState<any[]>([]);
  const [fornecedores, setFornecedores] = React.useState<any[]>([]);
  const [openEntrada, setOpenEntrada] = React.useState(false);
  const [openSaida, setOpenSaida] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        pagina: String(pagina),
        limite: String(PAGE_SIZE),
        ...(tipo ? { tipo } : {}),
        ...(produtoId ? { produto_id: produtoId } : {}),
        ...(dataInicio ? { data_inicio: dataInicio } : {}),
        ...(dataFim ? { data_fim: dataFim } : {}),
      });
      const r = await api<any>(`/movimentacoes?${qs}`);
      setData(r);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }, [api, pagina, tipo, produtoId, dataInicio, dataFim]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    (async () => {
      try {
        const [p, f] = await Promise.all([
          api<any>(`/produtos?limite=500&ativo=true`),
          api<any>(`/fornecedores?limite=200&ativo=true`),
        ]);
        setProdutos(p?.dados || []);
        setFornecedores(f?.dados || []);
      } catch {
        /* noop */
      }
    })();
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap">
        <Field label="Tipo">
          <Select
            value={tipo}
            onChange={(e) => {
              setPagina(1);
              setTipo(e.target.value);
            }}
            className="w-full sm:w-36"
          >
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
            <option value="transferencia">Transferência</option>
          </Select>
        </Field>
        <Field label="Produto" className="col-span-2 sm:col-auto">
          <Select
            value={produtoId}
            onChange={(e) => {
              setPagina(1);
              setProdutoId(e.target.value);
            }}
            className="w-full sm:w-56"
          >
            <option value="">Todos</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} — {p.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="De">
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => {
              setPagina(1);
              setDataInicio(e.target.value);
            }}
          />
        </Field>
        <Field label="Até">
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => {
              setPagina(1);
              setDataFim(e.target.value);
            }}
          />
        </Field>
        <div className="ml-auto flex gap-2">
          {canWrite && (
            <>
              <Button variant="primary" onClick={() => setOpenEntrada(true)}>
                <ArrowDownToLine className="size-4" /> Entrada
              </Button>
              <Button variant="destructive" onClick={() => setOpenSaida(true)}>
                <ArrowUpFromLine className="size-4" /> Saída
              </Button>
            </>
          )}
        </div>
      </div>

      <Table
        loading={loading}
        empty={data.dados.length === 0}
        head={
          <>
            <Th>Data</Th>
            <Th>Produto</Th>
            <Th>Tipo</Th>
            <Th className="text-right">Qtd</Th>
            <Th className="text-right">Anterior → Posterior</Th>
            <Th>Motivo</Th>
            <Th>Ref.</Th>
            <Th>Usuário</Th>
          </>
        }
      >
        {data.dados.map((m: any, i: number) => (
          <tr key={m.id || i}>
            <Td className="whitespace-nowrap font-mono text-xs">{fmtDateTime(m.criado_em)}</Td>
            <Td>{m.produto_nome}</Td>
            <Td>
              <MovTipoBadge tipo={m.tipo} />
            </Td>
            <Td className="text-right font-mono">{fmtNum(m.quantidade, 3)}</Td>
            <Td className="text-right font-mono text-muted-foreground">
              {fmtNum(m.quantidade_anterior, 3)} → {fmtNum(m.quantidade_posterior, 3)}
            </Td>
            <Td>{m.motivo}</Td>
            <Td className="font-mono text-xs">{m.referencia || "—"}</Td>
            <Td className="text-muted-foreground">{m.usuario_nome || "—"}</Td>
          </tr>
        ))}
      </Table>

      <Pagination
        pagina={data.paginacao?.pagina || pagina}
        paginas={data.paginacao?.paginas || 1}
        onChange={setPagina}
      />

      {openEntrada && (
        <EntradaSaidaModal
          tipo="entrada"
          produtos={produtos}
          fornecedores={fornecedores}
          onClose={() => setOpenEntrada(false)}
          onDone={() => {
            setOpenEntrada(false);
            load();
          }}
        />
      )}
      {openSaida && (
        <EntradaSaidaModal
          tipo="saida"
          produtos={produtos}
          fornecedores={fornecedores}
          onClose={() => setOpenSaida(false)}
          onDone={() => {
            setOpenSaida(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function EntradaSaidaModal({
  tipo,
  produtos,
  fornecedores,
  onClose,
  onDone,
}: {
  tipo: "entrada" | "saida";
  produtos: any[];
  fornecedores: any[];
  onClose: () => void;
  onDone: () => void;
}) {
  const api = useApi();
  const [produtoId, setProdutoId] = React.useState("");
  const [qtd, setQtd] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [referencia, setReferencia] = React.useState("");
  const [fornecedorId, setFornecedorId] = React.useState("");
  const [precoUnit, setPrecoUnit] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const sel = produtos.find((p) => p.id === produtoId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const path = tipo === "entrada" ? "/movimentacoes/entrada" : "/movimentacoes/saida";
      const body: any = {
        produto_id: produtoId,
        quantidade: Number(qtd),
        motivo,
        referencia,
      };
      if (tipo === "entrada") {
        if (fornecedorId) body.fornecedor_id = fornecedorId;
        if (precoUnit) body.preco_unitario = Number(precoUnit);
      }
      await api(path, { method: "POST", body: JSON.stringify(body) });
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
    <Modal
      open
      onClose={onClose}
      title={`Registrar ${tipo === "entrada" ? "Entrada" : "Saída"}`}
      size="md"
    >
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Produto" className="col-span-2">
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
          <div className="col-span-2 -mt-1 font-mono text-xs text-muted-foreground">
            Estoque atual:{" "}
            <span className="text-foreground">{fmtNum(sel.estoque_atual, 3)}</span>{" "}
            {sel.unidade_medida}
          </div>
        )}
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
