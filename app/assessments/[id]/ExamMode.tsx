"use client";

import { useEffect } from "react";

/**
 * Switches the document into exam chrome: hides the arcade HUD and swaps the
 * surface for a sterile one.
 *
 * Deliberately NOT a theme. The exam styles live in their own `--x-*`
 * variable namespace under `html[data-exam]`, so whatever palette is selected
 * elsewhere is simply not referenced here — a candidate cannot make a graded
 * assessment look like a game. That also means there is no need to touch
 * `data-theme`, which the theme provider owns and would only fight over.
 */
export default function ExamMode() {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-exam", "1");
    document.body.classList.add("exam-mode");
    // The lab pages set this for their flat black stage; an exam is not one.
    const hadPirate = document.body.classList.contains("pirate-mode");
    document.body.classList.remove("pirate-mode");

    return () => {
      html.removeAttribute("data-exam");
      document.body.classList.remove("exam-mode");
      if (hadPirate) document.body.classList.add("pirate-mode");
    };
  }, []);

  return null;
}
