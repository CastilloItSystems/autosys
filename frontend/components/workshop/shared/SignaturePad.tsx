"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";

interface SignaturePadProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  height?: number;
}

export default function SignaturePad({
  value,
  onChange,
  disabled = false,
  height = 180,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Draw existing image on mount or when value changes externally
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  // Resize canvas on mount to match display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || canvas.offsetWidth || 400;
    canvas.height = height;
  }, [height]);

  const getPoint = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ): { x: number; y: number } => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
      return {
        x: (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left,
        y: (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (disabled) return;
      isDrawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPoint(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [disabled, getPoint]
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawingRef.current || disabled) return;
      if ("touches" in e) {
        e.preventDefault();
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPoint(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [disabled, getPoint]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange?.(canvas.toDataURL("image/png"));
  }, [onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange?.("");
  }, [onChange]);

  return (
    <div className="flex flex-column gap-2">
      <canvas
        ref={canvasRef}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{
          border: "1px solid var(--surface-300)",
          borderRadius: 6,
          background: "#ffffff",
          width: "100%",
          cursor: disabled ? "not-allowed" : "crosshair",
          touchAction: "none",
          display: "block",
        }}
      />
      <div className="flex align-items-center justify-content-between">
        {!disabled && (
          <Button
            label="Limpiar"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            type="button"
            onClick={clear}
          />
        )}
        {!value && (
          <span className="text-sm text-500 ml-auto">Firma requerida</span>
        )}
      </div>
    </div>
  );
}
