import * as React from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeftRight,
  Truck,
  Tags,
  ClipboardList,
  Settings,
  LogOut,
  Boxes,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export type PageKey =
  | "dashboard"
  | "produtos"
  | "estoque"
  | "movimentacoes"
  | "fornecedores"
  | "categorias"
  | "ordens"
  | "config";

const NAV: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "produtos", label: "Produtos", icon: Package },
  { key: "estoque", label: "Estoque", icon: Warehouse },
  { key: "movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { key: "fornecedores", label: "Fornecedores", icon: Truck },
  { key: "categorias", label: "Categorias", icon: Tags },
  { key: "ordens", label: "Ordens de Compra", icon: ClipboardList },
  { key: "config", label: "Configurações", icon: Settings, adminOnly: true },
];

export const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  estoque: "Estoque",
  movimentacoes: "Movimentações",
  fornecedores: "Fornecedores",
  categorias: "Categorias",
  ordens: "Ordens de Compra",
  config: "Configurações",
};

export function Shell({
  page,
  setPage,
  children,
}: {
  page: PageKey;
  setPage: (p: PageKey) => void;
  children: React.ReactNode;
}) {
  const { user, empresa, logout } = useAuth();
  const isAdmin = user?.perfil === "admin";
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Fechar drawer ao trocar de página
  const handleSetPage = React.useCallback(
    (p: PageKey) => {
      setPage(p);
      setMobileOpen(false);
    },
    [setPage],
  );

  // Bloquear scroll do body quando drawer aberto
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  const SidebarInner = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary/15 text-primary">
            <Boxes className="size-4" />
          </div>
          <div className="leading-none">
            <p className="font-display text-sm">ESTOQUE.OPS</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              v1.0
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((n) => {
          const Icon = n.icon;
          const active = page === n.key;
          return (
            <button
              key={n.key}
              onClick={() => handleSetPage(n.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{n.label}</span>
              {active && <span className="ml-auto block size-1.5 shrink-0 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive"
        >
          <LogOut className="size-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar desktop (lg+) */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {SidebarInner}
      </aside>

      {/* Drawer mobile/tablet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-[260px] max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            {SidebarInner}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="-ml-1 rounded p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-base leading-none">
                {PAGE_LABELS[page]}
              </h1>
              <p className="mt-1 hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
                Sistema de Gestão de Estoque
              </p>
            </div>
          </div>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm">{user?.nome || user?.email || "—"}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="hidden sm:inline">
                {empresa?.nome || user?.nome_empresa || "Empresa"} ·{" "}
              </span>
              {user?.perfil || "—"}
            </p>
          </div>
        </header>
        <main key={page} className="fade-in flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
