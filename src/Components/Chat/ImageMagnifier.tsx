import React, { useEffect, useRef, useState } from "react";
import "@/Styles/Chat/ImageMagnifier.css";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  zoom?: number;
  lensSize?: number;
  rounded?: boolean;
  showLensIcon?: boolean;
  wheelZoom?: boolean;
  ctrlKeyOnly?: boolean;
  zoomStep?: number;
  minZoom?: number;
  maxZoom?: number;
  defaultActive?: boolean;
  onZoomChange?: (z: number) => void;
  onActiveChange?: (active: boolean) => void;
};

const LONG_PRESS_MS = 220;

export const ImageMagnifier: React.FC<Props> = ({
  src,
  alt = "Imagen",
  className,
  zoom = 2,
  lensSize = 160,
  rounded = true,
  showLensIcon = true,
  wheelZoom = true,
  ctrlKeyOnly = false,
  zoomStep = 0.2,
  minZoom = 1,
  maxZoom = 6,
  defaultActive = false,
  onZoomChange,
  onActiveChange,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [active, setActive] = useState(defaultActive);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoomState, setZoomState] = useState(() => Math.min(Math.max(zoom, minZoom), maxZoom));
  const longPressTimer = useRef<number | null>(null);
  const rafMove = useRef<number | null>(null);

  const lensHalf = lensSize / 2;

  // Carga tamaño natural de la imagen
  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  // Observa el tamaño del wrapper para recalcular background-size
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;

    const updateBgSize = () => {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !rect.height || !natural.w || !natural.h) {
        wrap.style.setProperty("--lens-bg-size", "auto");
        return;
      }
      const scaleX = (zoomState * natural.w) / rect.width;
      const scaleY = (zoomState * natural.h) / rect.height;
      wrap.style.setProperty("--lens-bg-size", `${scaleX * 100}% ${scaleY * 100}%`);
    };

    updateBgSize();

    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(updateBgSize);
      ro.observe(wrap);
    }
    window.addEventListener("resize", updateBgSize);

    return () => {
      window.removeEventListener("resize", updateBgSize);
      if (ro) ro.disconnect();
    };
  }, [natural.w, natural.h, zoomState]);

  // Actualiza variables CSS estáticas/dinámicas
  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    wrap.style.setProperty("--lens-size", `${lensSize}px`);
    wrap.style.setProperty("--lens-half", `${lensHalf}px`);
    wrap.style.setProperty("--lens-border-radius", rounded ? "9999px" : "12px");
  }, [lensSize, lensHalf, rounded]);

  // Callback utilitario
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const getRel = (clientX: number, clientY: number) => {
    const wrap = wrapperRef.current;
    if (!wrap) return { rx: 0, ry: 0, pctX: 0, pctY: 0, rect: new DOMRect() };
    const rect = wrap.getBoundingClientRect();
    const rx = clientX - rect.left;
    const ry = clientY - rect.top;
    const pctX = clamp(rx / rect.width, 0, 1);
    const pctY = clamp(ry / rect.height, 0, 1);
    return { rx, ry, pctX, pctY, rect };
  };

  const setBgPos = (pctX: number, pctY: number) => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    wrap.style.setProperty("--lens-bg-pos", `${pctX * 100}% ${pctY * 100}%`);
  };

  const updatePos = (clientX: number, clientY: number) => {
    if (rafMove.current) cancelAnimationFrame(rafMove.current);
    rafMove.current = requestAnimationFrame(() => {
      const { rx, ry, pctX, pctY, rect } = getRel(clientX, clientY);
      const cx = clamp(rx, lensHalf, rect.width - lensHalf);
      const cy = clamp(ry, lensHalf, rect.height - lensHalf);
      setPos({ x: cx, y: cy });
      setBgPos(pctX, pctY);
    });
  };

  const toggleActive = (v: boolean) => {
    setActive(v);
    onActiveChange?.(v);
  };

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!active) return;
    updatePos(e.clientX, e.clientY);
  };

  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    toggleActive(true);
    updatePos(e.clientX, e.clientY);
  };

  const onMouseLeave = () => {
    toggleActive(false);
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    const t = e.touches[0];
    longPressTimer.current = window.setTimeout(() => {
      toggleActive(true);
      updatePos(t.clientX, t.clientY);
    }, LONG_PRESS_MS) as unknown as number;
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!active) return;
    const t = e.touches[0];
    updatePos(t.clientX, t.clientY);
    e.preventDefault();
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    toggleActive(false);
  };

  const setZoomClamped = (z: number) => {
    const nz = clamp(z, minZoom, maxZoom);
    setZoomState(nz);
    onZoomChange?.(nz);
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!wheelZoom) return;
    if (ctrlKeyOnly && !e.ctrlKey) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    const next = delta > 0 ? zoomState - zoomStep : zoomState + zoomStep;
    setZoomClamped(next);
    updatePos(e.clientX, e.clientY);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleActive(!active);
      return;
    }
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      setZoomClamped(zoomState + zoomStep);
      return;
    }
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      setZoomClamped(zoomState - zoomStep);
      return;
    }
    if (e.key.toLowerCase() === "escape") {
      if (active) {
        e.preventDefault();
        toggleActive(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (rafMove.current) cancelAnimationFrame(rafMove.current);
      if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="imgmag-wrapper"
      style={
        {
          "--lens-size": `${lensSize}px`,
          "--lens-half": `${lensHalf}px`,
          "--lens-border-radius": rounded ? "9999px" : "12px",
        } as React.CSSProperties
      }
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="img"
      aria-label={alt}
      aria-roledescription="lupa de imagen"
      aria-live="polite"
    >
      <img ref={imgRef} src={src} alt={alt} className={className || "imgmag-img"} />

      {active && (
        <div
          className="imgmag-lens"
          style={{
            left: pos.x - lensHalf,
            top: pos.y - lensHalf,
            backgroundImage: `url(${src})`,
          }}
        />
      )}

      {showLensIcon && !active && <div className="imgmag-hint" aria-hidden>🔍</div>}
    </div>
  );
};