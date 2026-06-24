import { cn } from "@/lib/utils";

export default function BrandButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  const baseStyles = "rounded-lg font-medium transition-all duration-200 flex items-center gap-2 active:scale-95";
  
  const variants = {
    primary: "bg-gold text-navy shadow-lg hover:shadow-xl hover:bg-yellow-500",
    secondary: "bg-white border border-slate-200 text-navy hover:shadow-soft",
    ghost: "text-navy hover:bg-slate-100",
    outline: "border border-navy text-navy hover:bg-navy/5",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}