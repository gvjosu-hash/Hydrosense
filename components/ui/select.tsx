import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta?: string;
}

export const Selector = forwardRef<HTMLSelectElement, SelectorProps>(
  ({ etiqueta, id, className = "", children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {etiqueta && (
          <label htmlFor={selectId} className="text-base font-medium text-texto">
            {etiqueta}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`text-lg px-4 py-3 min-h-12 rounded-xl border-2 border-borde-fuerte bg-superficie text-texto focus:outline-none focus:ring-2 focus:ring-acento/40 focus:border-acento ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Selector.displayName = "Selector";
