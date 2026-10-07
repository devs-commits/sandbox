"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { Button } from "../../../ui/button";

export type Screenshot = { url: string; alt: string; label: string; width?: number };

export function ScreenshotLightbox({ shot, onClose }: { shot: Screenshot | null; onClose: () => void }) {
  const opener = useRef<HTMLElement | null>(null);
  const [lastShot, setLastShot] = useState(shot);
  if (shot && shot !== lastShot) setLastShot(shot);

  return (
    <Dialog.Root open={shot !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="screenshot-backdrop" />
        <Dialog.Content
          className="screenshot-lightbox"
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          {lastShot && <LightboxImage key={`${lastShot.url}:${lastShot.label}`} shot={lastShot} onClose={onClose} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LightboxImage({ shot, onClose }: { shot: Screenshot; onClose: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const zoom = useRef<ReactZoomPanPinchRef>(null);
  const pointer = useRef({ x: 0, y: 0, moved: false });
  const swipe = useRef<{ x: number; y: number; time: number; multiple: boolean } | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const update = () => {
      setBounds({ width: element.clientWidth, height: element.clientHeight });
      setMobile(window.matchMedia("(max-width: 767px)").matches);
      zoom.current?.resetTransform(0);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, []);

  const ratio = natural.width ? Math.min(bounds.width / natural.width, bounds.height / natural.height) : 0;
  const width = natural.width * ratio;
  const height = natural.height * ratio;
  const actual = ratio > 0 ? 1 / ratio : 1;
  const fitted = Math.abs(scale - 1) < 0.02;
  const toggle = () => {
    if (!zoom.current) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    if (!fitted) zoom.current.resetTransform(duration);
    else zoom.current.centerView(actual, duration);
  };

  return (
    <div
      className="screenshot-takeover"
      onClick={(event) => {
        if (!(event.target instanceof Element)) return;
        if (!mobile && !event.target.closest("img, button")) onClose();
      }}
      onTouchStartCapture={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        if (event.touches.length > 1 && swipe.current) {
          swipe.current.multiple = true;
          return;
        }
        swipe.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), multiple: event.touches.length > 1 };
      }}
      onTouchEndCapture={(event) => {
        const start = swipe.current;
        const touch = event.changedTouches[0];
        if (event.touches.length) return;
        swipe.current = null;
        if (!mobile || !fitted || !start || !touch || start.multiple) return;
        const dy = Math.abs(touch.clientY - start.y);
        const dx = Math.abs(touch.clientX - start.x);
        if (dy > 90 && dy > dx * 1.5 && Date.now() - start.time < 700) onClose();
      }}
    >
      <header className="screenshot-toolbar">
        <Dialog.Title className="min-w-0 truncate text-sm font-semibold text-soft">{shot.label}</Dialog.Title>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            title={fitted ? "100% actual size" : "Fit to screen"}
            aria-label={fitted ? "View screenshot at actual size" : "Fit screenshot to screen"}
            className="h-12 w-12 text-soft hover:bg-soft/15 hover:text-soft"
          >
            {fitted ? <ZoomIn /> : <ZoomOut />}
          </Button>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close enlarged screenshot"
              className="h-12 w-12 border border-soft/25 bg-panel text-soft hover:bg-slate-line hover:text-soft"
            >
              <X />
            </Button>
          </Dialog.Close>
        </div>
      </header>
      <div ref={stage} className="screenshot-stage" data-scale={scale} data-mode={fitted ? "fit" : "zoomed"}>
        {bounds.width > 0 && bounds.height > 0 && (
          <TransformWrapper
            ref={zoom}
            minScale={Math.min(1, actual)}
            maxScale={Math.max(8, actual * 2)}
            centerOnInit
            centerZoomedOut
            limitToBounds
            panning={{ disabled: fitted, velocityDisabled: true }}
            doubleClick={{ disabled: !mobile, mode: "toggle", step: 1 }}
            wheel={{ step: 0.12 }}
            pinch={{ step: 5 }}
            onTransform={(_, state) => setScale(state.scale)}
          >
            <TransformComponent wrapperClass="screenshot-transform" contentClass="screenshot-transform-content">
              <img
                src={shot.url}
                alt={shot.alt}
                draggable={false}
                onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                style={{ width: width || undefined, height: height || undefined }}
                className={`screenshot-full-image ${fitted ? "cursor-zoom-in" : "cursor-grab active:cursor-grabbing"}`}
                onPointerDown={(event) => {
                  pointer.current = { x: event.clientX, y: event.clientY, moved: false };
                }}
                onPointerMove={(event) => {
                  if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 6) pointer.current.moved = true;
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!mobile && !pointer.current.moved) toggle();
                }}
              />
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>
    </div>
  );
}

export function ScreenshotThumbnail({ shot, onOpen, className }: { shot: Screenshot; onOpen: () => void; className: string }) {
  return (
    <Button
      variant="ghost"
      onClick={onOpen}
      aria-label={`Open ${shot.label} screenshot`}
      className="block h-auto w-full rounded-none p-0 hover:bg-transparent focus-visible:ring-inset"
    >
      <img src={shot.url} alt={shot.alt} className={className} loading="eager" decoding="async" />
    </Button>
  );
}
