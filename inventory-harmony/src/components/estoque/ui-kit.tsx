import * as React from "react";
import { Search, X, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col rounded-md border border-border bg-card shadow-xl",
          widths[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="font-display text-base">{title}</h3>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- ConfirmDialog ---------- */
export function ConfirmDialog({
  open,
  title = "Confirmar ação",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="text-sm text-muted-foreground">{message}</div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={variant === "destructive" ? "destructive" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- Button ---------- */
type BtnVariant = "primary" | "ghost" | "secondary" | "destructive" | "info" | "warning";
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: "sm" | "md";
}) {
  const variants: Record<BtnVariant, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    info: "bg-info text-info-foreground hover:bg-info/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  };
  const sizes = { sm: "h-8 px-2.5 text-xs", md: "h-9 px-3.5 text-sm" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Input / Select / Textarea ---------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-9 w-full rounded-md border border-border bg-input px-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ---------- Badge ---------- */
type SituacaoTipo = "normal" | "critico" | "zerado" | "excesso";
export function SituacaoBadge({ value }: { value?: SituacaoTipo | string }) {
  const map: Record<string, string> = {
    normal: "bg-success/15 text-success border-success/30",
    critico: "bg-warning/15 text-warning border-warning/30",
    zerado: "bg-destructive/15 text-destructive border-destructive/30",
    excesso: "bg-info/15 text-info border-info/30",
  };
  const v = (value || "normal") as string;
  return (
    <span
      className={cn(
        "inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        map[v] || "bg-muted text-muted-foreground border-border",
      )}
    >
      {v}
    </span>
  );
}

export function MovTipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    entrada: "bg-success/15 text-success border-success/30",
    saida: "bg-destructive/15 text-destructive border-destructive/30",
    ajuste: "bg-info/15 text-info border-info/30",
    transferencia: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        map[tipo] || "bg-muted text-muted-foreground border-border",
      )}
    >
      {tipo}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground border-border",
    enviada: "bg-info/15 text-info border-info/30",
    aprovada: "bg-warning/15 text-warning border-warning/30",
    recebida: "bg-success/15 text-success border-success/30",
    cancelada: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        map[status] || "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

/* ---------- SearchInput (debounced) ---------- */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}

/* ---------- EmptyState / Loading ---------- */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nada por aqui",
  description,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <p className="mt-3 font-display text-sm">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-10", className)}>
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

/* ---------- Table + Pagination ---------- */
export function Table({
  head,
  children,
  empty,
  loading,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="overflow-auto rounded-md border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-surface text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>{head}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={99}>
                <LoadingSpinner />
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={99}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("border-b border-border px-3 py-2 font-medium", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-border/60 px-3 py-2 align-middle", className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function Pagination({
  pagina,
  paginas,
  onChange,
}: {
  pagina: number;
  paginas: number;
  onChange: (p: number) => void;
}) {
  if (!paginas || paginas <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-xs text-muted-foreground">
      <div className="font-mono">
        Página {pagina} de {paginas}
      </div>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          disabled={pagina <= 1}
          onClick={() => onChange(pagina - 1)}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pagina >= paginas}
          onClick={() => onChange(pagina + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
