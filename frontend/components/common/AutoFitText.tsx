"use client";

import { useEffect, useRef, useState } from "react";

interface AutoFitTextProps {
  text?: string | null;
  /** Tamaño máximo de fuente en px (punto de partida). */
  maxFontSize?: number;
  /** Tamaño mínimo de fuente en px antes de recurrir a elipsis. */
  minFontSize?: number;
  className?: string;
  title?: string;
}

/**
 * Muestra el texto en UNA línea reduciendo la fuente hasta que cabe en el
 * ancho disponible. Si llega al mínimo y aún no cabe, recorta con elipsis.
 * Se re-ajusta ante cambios de tamaño del contenedor (ResizeObserver).
 */
export default function AutoFitText({
  text,
  maxFontSize = 30,
  minFontSize = 14,
  className,
  title,
}: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const fit = () => {
      const container = containerRef.current;
      const textEl = textRef.current;
      if (!container || !textEl) return;

      let size = maxFontSize;
      textEl.style.fontSize = `${size}px`;
      while (textEl.scrollWidth > container.clientWidth && size > minFontSize) {
        size -= 1;
        textEl.style.fontSize = `${size}px`;
      }
      setFontSize(size);
    };

    fit();

    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text, maxFontSize, minFontSize]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <span
        ref={textRef}
        className={className}
        title={title ?? text ?? undefined}
        style={{
          fontSize,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
          maxWidth: "100%",
        }}
      >
        {text}
      </span>
    </div>
  );
}
