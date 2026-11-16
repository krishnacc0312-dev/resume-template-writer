"use client";
import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registers the service worker and shows "Install app" when the browser offers it. */
export default function AppInstall() {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [showIos, setShowIos] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register("/sw.js").catch(() => {});
    const on = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); };
    window.addEventListener("beforeinstallprompt", on);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  if (evt) return (
    <button type="button" className="btn small" onClick={async () => { await evt.prompt(); await evt.userChoice; setEvt(null); }}>⤓ Install app</button>
  );
  if (ios) return (
    <span>
      <button type="button" className="btn small" onClick={() => setShowIos(!showIos)}>⤓ Install app</button>
      {showIos && <span className="muted" style={{ display: "block", marginTop: 6 }}>In Safari, tap Share, then &quot;Add to Home Screen&quot;.</span>}
    </span>
  );
  return null;
}
