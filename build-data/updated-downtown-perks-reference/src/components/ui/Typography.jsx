import React from 'react';
import { cn } from "@/lib/utils";

export function H1({ children, className }) {
  return (
    <h1 className={cn(
      "text-4xl md:text-6xl font-bold tracking-tight text-navy leading-tight",
      className
    )}>
      {children}
    </h1>
  );
}

export function H2({ children, className }) {
  return (
    <h2 className={cn(
      "text-3xl md:text-4xl font-semibold tracking-tight text-navy",
      className
    )}>
      {children}
    </h2>
  );
}

export function H3({ children, className }) {
  return (
    <h3 className={cn(
      "text-xl md:text-2xl font-semibold text-navy",
      className
    )}>
      {children}
    </h3>
  );
}

export function Body({ children, className }) {
  return (
    <p className={cn(
      "text-base md:text-lg text-textSecondary leading-relaxed",
      className
    )}>
      {children}
    </p>
  );
}

export function Micro({ children, className }) {
  return (
    <span className={cn(
      "text-sm text-textMuted",
      className
    )}>
      {children}
    </span>
  );
}

export function Label({ children, className }) {
  return (
    <label className={cn(
      "text-xs font-semibold uppercase tracking-wide text-textMuted",
      className
    )}>
      {children}
    </label>
  );
}