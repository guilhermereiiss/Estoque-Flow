import * as React from "react";
import { useApi } from "@/lib/auth-context";
import { fmtBRL, fmtNum } from "@/lib/format";
import { LoadingSpinner, Table, Th, Td, EmptyState } from "@/components/estoque/ui-kit";
import { Package, DollarSign, AlertTriangle, ClipboardList } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#9ca3af"];

export default function DashboardPage() {
  const api = useApi();
  const [data, setData] = React.useState<any>(null);
  const [alertas, setAlertas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [d, a] = await Promise.all([
          api<any>("/relatorios/dashboard"),
          api<any[]>("/produtos/alertas/abaixo-minimo"),
        ]);
        if (!alive) return;
        setData(d);
        setAlertas(Array.isArray(a) ? a : []);
      } catch (err: any) {
        toast.error(typeof err === "string" ? err : err?.message || "Erro ao carregar dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState title="Dashboard indisponível" />;

  const totalProdutos = data?.estoque?.total_produtos ?? 0;
  const valorCusto = data?.estoque?.valor_custo ?? 0;
  const abaixoMin = data?.alertas?.produtos_abaixo_minimo ?? 0;
  const ordens = Array.isArray(data?.ordens_compra) ? data.ordens_compra : [];
  const ordensPend = ordens
    .filter((o: any) => ["rascunho", "enviada", "aprovada"].includes(o.status))
    .reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  const movs = Array.isArray(data?.movimentacoes_30d) ? data.movimentacoes_30d : [];
  const entradas = movs.find((m: any) => m.tipo === "entrada") || { total: 0, quantidade: 0 };
  const saidas = movs.find((m: any) => m.tipo === "saida") || { total: 0, quantidade: 0 };
  const ajustes = movs.find((m: any) => m.tipo === "ajuste") || { total: 0, quantidade: 0 };
  const barData = [
    { name: "Entradas", operacoes: Number(entradas.total) || 0, qtd: Number(entradas.quantidade) || 0 },
    { name: "Saídas", operacoes: Number(saidas.total) || 0, qtd: Number(saidas.quantidade) || 0 },
    { name: "Ajustes", operacoes: Number(ajustes.total) || 0, qtd: Number(ajustes.quantidade) || 0 },
  ];

  const pieData = ordens.map((o: any) => ({ name: o.status, value: Number(o.total) || 0 }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Produtos" value={fmtNum(totalProdutos)} />
        <StatCard icon={DollarSign} label="Valor em Estoque" value={fmtBRL(valorCusto)} />
        <StatCard
          icon={AlertTriangle}
          label="Abaixo do Mínimo"
          value={fmtNum(abaixoMin)}
          tone={abaixoMin > 0 ? "warning" : "default"}
        />
        <StatCard icon={ClipboardList} label="Ordens Pendentes" value={fmtBRL(ordensPend)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-4 lg:col-span-2">
          <h3 className="mb-3 font-display text-sm">Movimentações — últimos 30 dias</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1e2128",
                    border: "1px solid #2a2d3a",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="operacoes" name="Operações" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="qtd" name="Quantidade" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm">Ordens por status</h3>
          <div className="h-64">
            {pieData.length === 0 ? (
              <EmptyState title="Sem ordens" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={(e: any) => e.name}
                    labelLine={false}
                    fontSize={10}
                  >
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1e2128",
                      border: "1px solid #2a2d3a",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm">Alertas — produtos abaixo do mínimo</h3>
        <Table
          empty={alertas.length === 0}
          head={
            <>
              <Th>Código</Th>
              <Th>Produto</Th>
              <Th className="text-right">Estoque atual</Th>
              <Th className="text-right">Mínimo</Th>
              <Th className="text-right">Faltam</Th>
            </>
          }
        >
          {alertas.map((p: any) => (
            <tr key={p.id}>
              <Td className="font-mono text-xs">{p.codigo}</Td>
              <Td>{p.nome}</Td>
              <Td className="text-right font-mono">{fmtNum(p.estoque_atual, 3)}</Td>
              <Td className="text-right font-mono">{fmtNum(p.estoque_minimo, 3)}</Td>
              <Td className="text-right font-mono text-warning">
                {fmtNum(p.quantidade_necessaria, 3)}
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}

function StatCard({
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
  const toneCls =
    tone === "warning"
      ? "text-warning"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className={`size-4 ${toneCls}`} />
      </div>
      <p className={`mt-2 font-display text-2xl ${toneCls}`}>{value}</p>
    </div>
  );
}
