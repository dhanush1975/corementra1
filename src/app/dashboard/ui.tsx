import type { ReactNode } from "react";

export function DCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-[#e5e5e5] rounded-2xl ${className}`}>{children}</div>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "blue" | "green" | "amber" | "red" | "purple" }) {
  const tones: Record<string, string> = {
    neutral: "bg-[#f2f4f7] text-[#475467]",
    blue: "bg-[#eaf1f9] text-[#141a20]",
    green: "bg-[#e7f4ec] text-[#14683f]",
    amber: "bg-[#fdf3e7] text-[#8a5a1a]",
    red: "bg-[#faeceb] text-[#a4372f]",
    purple: "bg-[#f1eefb] text-[#5341a6]",
  };
  return <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}

export function DBtn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-[#0a0a0a] text-white hover:bg-[#333]",
    secondary: "bg-white border border-[#e5e5e5] text-[#344054] hover:bg-[#f5f5f5]",
    ghost: "bg-transparent text-[#667085] hover:bg-[#f5f5f5]",
    danger: "bg-white border border-[#f3dcda] text-[#b4443a] hover:bg-[#fdf2f1]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function DInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", onFocus, ...rest } = props;
  // A number field defaulted to 0 otherwise forces you to backspace it
  // manually before typing the real value — select it on focus instead so
  // the first keystroke just replaces it.
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.type === "number" && (e.target.value === "0" || e.target.value === "")) e.target.select();
    onFocus?.(e);
  };
  return (
    <input
      {...rest}
      onFocus={handleFocus}
      className={`w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-white text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/15 transition ${className}`}
    />
  );
}

export function DSelect({ children, className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-white text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/15 transition ${className}`}
    >
      {children}
    </select>
  );
}

export function DTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      rows={props.rows || 3}
      className={`w-full px-3 py-2.5 rounded-xl border border-[#e5e5e5] bg-white text-sm text-[#0a0a0a] resize-y focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-[#0070f3]/15 transition ${className}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#667085]">{label}</label>
      {children}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-[#10161c]/45 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full ${wide ? "max-w-[720px]" : "max-w-[560px]"} max-h-[88vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="text-xl font-bold text-[#0a0a0a]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f4f7] text-[#475467] flex items-center justify-center text-sm hover:bg-[#e5e5e5] transition-colors shrink-0">✕</button>
        </div>
        {subtitle && <p className="text-xs text-[#98a2b3] mb-4">{subtitle}</p>}
        <div className={subtitle ? "" : "mt-4"}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-8 px-2 text-sm text-[#98a2b3]">{children}</div>;
}

export function KpiCard({ label, value, note, tone = "neutral" }: { label: string; value: string; note: string; tone?: "neutral" | "blue" | "green" | "amber" | "red" }) {
  const dots: Record<string, string> = { neutral: "#98a2b3", blue: "#0070f3", green: "#14683f", amber: "#8a5a1a", red: "#a4372f" };
  return (
    <DCard className="p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dots[tone] }} />
        <span className="text-xs text-[#667085]">{label}</span>
      </div>
      <span className="text-[28px] font-black text-[#0a0a0a] tracking-tight leading-none">{value}</span>
      <span className="text-[11px] text-[#98a2b3]">{note}</span>
    </DCard>
  );
}
