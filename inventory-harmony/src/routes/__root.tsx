import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import "../styles.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster
        theme="dark"
        position="top-right"
        duration={3000}
        toastOptions={{
          style: {
            background: "#1e2128",
            border: "1px solid #2a2d3a",
            color: "#e5e7eb",
            fontFamily: "DM Sans, sans-serif",
          },
        }}
      />
    </AuthProvider>
  );
}