import { useEffect, useState, type ReactNode } from "react";
import { Leaf, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_META } from "@/lib/curriculum";
import type { TopicStatus } from "@/lib/data";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card-paper p-5 sm:p-6", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({
  label,
  title,
  right,
}: {
  label?: string;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {label && <div className="label-caps mb-1">{label}</div>}
        <h2 className="text-xl text-foreground">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function useAnimatedValue(value: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setV(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  return v;
}

export function ProgressBar({
  value,
  color,
  className,
  label,
}: {
  value: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const v = useAnimatedValue(Math.max(0, Math.min(100, value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width: `${v}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 8,
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  label?: string;
}) {
  const v = useAnimatedValue(Math.max(0, Math.min(100, value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function SubjectDot({ k, className }: { k: keyof typeof SUBJECT_META; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", SUBJECT_META[k].dot, className)}
    />
  );
}

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors",
        active ? "bg-primary-tint text-primary-deep" : "bg-surface-2 text-muted-foreground",
        onClick && !active && "hover:text-foreground",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  label,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  label: string;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-2 py-1.5">
      <button
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <Minus className="size-4" />
      </button>
      <span className="num text-base font-medium">{format ? format(value) : value}</span>
      <button
        aria-label={`Increase ${label}`}
        onClick={() => onChange(+(value + step).toFixed(2))}
        className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

const STATUS: Record<TopicStatus, { label: string; cls: string }> = {
  not_started: { label: "Not started", cls: "bg-surface-2 text-muted-foreground" },
  in_progress: { label: "In progress", cls: "bg-sand/40 text-foreground" },
  done: { label: "Done", cls: "bg-primary-tint text-primary-deep" },
  revise: { label: "Revise", cls: "bg-clay-tint text-foreground" },
};
export const STATUS_ORDER: TopicStatus[] = ["not_started", "in_progress", "done", "revise"];

export function StatusPill({ status, onClick }: { status: TopicStatus; onClick?: () => void }) {
  const s = STATUS[status];
  return (
    <button
      onClick={onClick}
      aria-label={`Status: ${s.label}. Tap to change.`}
      className={cn("min-h-8 rounded-full px-3 text-xs font-medium transition-colors", s.cls)}
    >
      {s.label}
    </button>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Leaf className="size-6 text-primary" />
      <p className="font-display text-lg text-foreground">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer", className)} />;
}

export function CalmError({
  message = "Something didn't load. Take a breath and try again in a moment.",
}: {
  message?: string;
}) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{message}</p>
    </Card>
  );
}
