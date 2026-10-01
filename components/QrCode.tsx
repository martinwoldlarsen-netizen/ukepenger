"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR-koden lages i nettleseren. Før ble lenken sendt til en ekstern tjeneste
// (api.qrserver.com), og koblingslenken til iPaden skal ikke ut til andre.
export function QrImage({ value, size = 240, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1f3a2b", light: "#ffffff" } })
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => {
        if (alive) setSrc(null);
      });
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) return <div className={className} style={{ width: size, height: size }} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR-kode for å koble til iPaden" width={size} height={size} className={className} />;
}
