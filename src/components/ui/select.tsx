import * as React from "react"
import { cn } from "@/lib/utils"

function Select({ className, value, onChange, onValueChange, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { 
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      data-slot="select"
      className={cn(
        "border-input flex w-fit items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 bg-bg",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
Select.displayName = "Select";

function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SelectItem({ className, children, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return (
    <option
      className={cn("text-sm", className)}
      {...props}
    >
      {children}
    </option>
  );
}

function SelectValue({ value, placeholder }: { value?: string; placeholder?: string }) {
  return <span>{value || placeholder || ""}</span>;
}

function SelectLabel({ className, children, ...props }: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)} {...props}>
      {children}
    </label>
  );
}

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SelectSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-border -mx-1 my-1 h-px", className)} {...props} />;
}

function SelectTrigger({ className, value, onValueChange, placeholder, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { 
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "border-input flex w-fit items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50 bg-bg border-line text-[10px] font-bold uppercase",
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}