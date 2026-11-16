"use client";
import { useEffect, useState } from "react";

/** 3-second welcome animation, shown once per browser session. */
export default function Splash() {
  const [state, setState] = useState<"hidden" | "show" | "out">("hidden");
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("rtw-splash") === "1"; sessionStorage.setItem("rtw-splash", "1"); } catch { /* storage blocked */ }
    if (seen) return;
    setState("show");
    const t1 = setTimeout(() => setState("out"), 3000);
    const t2 = setTimeout(() => setState("hidden"), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  useEffect(() => {
    document.body.style.overflow = state === "show" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [state]);
  if (state === "hidden") return null;
  const skip = () => { setState("out"); setTimeout(() => setState("hidden"), 600); };
  return (
    <div className={"splash" + (state === "out" ? " out" : "")} role="presentation" onClick={skip}>
      <div className="wl-doc" aria-hidden="true"><span className="l1" /><span className="l2" /><span className="l3" /><span className="l4" /><span className="l5" /></div>
      <p className="wl-title">Resume Template Writer</p>
      <p className="wl-sub">Your resume, rebuilt in a clean template. Word for word.</p>
      <div className="wl-bar" aria-hidden="true"><span /></div>
      <button type="button" className="wl-skip" onClick={skip}>Skip</button>
    </div>
  );
}
