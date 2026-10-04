import { cn, initials } from "@/lib/utils";

const gradients = [
  "from-violet-500 to-blue-500",
  "from-fuchsia-500 to-violet-500",
  "from-sky-500 to-emerald-500",
  "from-amber-500 to-rose-500",
  "from-blue-500 to-cyan-400",
];

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const index = name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % gradients.length;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-ink-800",
        gradients[index],
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}