import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/components/estoque/LoginPage";
import { Shell, type PageKey } from "@/components/estoque/Shell";
import DashboardPage from "@/components/estoque/DashboardPage";
import ProdutosPage from "@/components/estoque/ProdutosPage";
import EstoquePage from "@/components/estoque/EstoquePage";
import MovimentacoesPage from "@/components/estoque/MovimentacoesPage";
import FornecedoresPage from "@/components/estoque/FornecedoresPage";
import CategoriasPage from "@/components/estoque/CategoriasPage";
import OrdensComprasPage from "@/components/estoque/OrdensComprasPage";
import ConfigPage from "@/components/estoque/ConfigPage";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { token } = useAuth();
  const [page, setPage] = React.useState<PageKey>("dashboard");

  if (!token) return <LoginPage />;

  return (
    <Shell page={page} setPage={setPage}>
      {page === "dashboard" && <DashboardPage />}
      {page === "produtos" && <ProdutosPage />}
      {page === "estoque" && <EstoquePage />}
      {page === "movimentacoes" && <MovimentacoesPage />}
      {page === "fornecedores" && <FornecedoresPage />}
      {page === "categorias" && <CategoriasPage />}
      {page === "ordens" && <OrdensComprasPage />}
      {page === "config" && <ConfigPage />}
    </Shell>
  );
}
