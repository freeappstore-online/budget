import { useRef, useEffect, useCallback } from "react";

/**
 * Hook for canvas-based charts. Returns a ref to attach to the canvas element
 * and handles DPR scaling + resize observation.
 */
export function useCanvasChart(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): React.RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    draw(ctx, w, h);
  }, [draw]);

  useEffect(() => {
    render();

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => render());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [render]);

  return canvasRef;
}
