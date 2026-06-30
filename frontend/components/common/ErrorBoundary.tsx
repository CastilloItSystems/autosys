"use client";

import React from "react";
import { Button } from "primereact/button";
import { logger } from "@/utils/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** UI alternativa; si se omite, se usa el fallback por defecto. */
  fallback?: React.ReactNode;
  /** Nombre del módulo, para identificar el error en los logs. */
  module?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Captura errores de render en su subárbol y muestra un fallback en lugar de
 * dejar la pantalla en blanco. Envolver con esto las páginas/módulos de feature.
 *
 * Los error boundaries deben ser componentes de clase (React no expone el
 * mecanismo en hooks).
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(
      `[ErrorBoundary${this.props.module ? `:${this.props.module}` : ""}]`,
      error,
      info.componentStack,
    );
  }

  handleReset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-column align-items-center justify-content-center gap-3 p-5 text-center">
        <i className="pi pi-exclamation-triangle text-4xl text-orange-500" />
        <h3 className="m-0">Ocurrió un error inesperado</h3>
        <p className="text-color-secondary m-0">
          Intenta recargar la sección. Si el problema persiste, contacta a
          soporte.
        </p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          onClick={this.handleReset}
        />
      </div>
    );
  }
}

export default ErrorBoundary;
