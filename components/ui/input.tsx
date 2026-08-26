import { InputHTMLAttributes, forwardRef } from "react";

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  error?: string;
}

export const Campo = forwardRef<HTMLInputElement, CampoProps>(
  ({ etiqueta, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {etiqueta && (
          <label htmlFor={inputId} className="text-base font-medium text-texto">
            {etiqueta}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`text-lg px-4 py-3 min-h-12 rounded-xl border-2 bg-superficie text-texto placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-acento/40 ${
            error ? "border-peligro" : "border-borde-fuerte focus:border-acento"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-peligro">{error}</p>}
      </div>
    );
  }
);
Campo.displayName = "Campo";
