/**
 * Project view — opens in place over the journey. Vertical wheel, drag, touch
 * and arrow keys all move the track horizontally through: cover → brief →
 * images → materials → next project.
 */
import gsap from "gsap";
import { PROJECTS } from "./projects.js";

export function createProjectView({ onOpen, onClose }) {
  const $ = s => document.querySelector(s);
  const root = $("#pv"), viewport = $("#pvViewport"), track = $("#pvTrack");
  const nameEl = $("#pvName"), counterEl = $("#pvCounter"), progressEl = $("#pvProgress"), hint = $("#pvHint");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let open = false, idx = 0, target = 0, current = 0, max = 0, raf = null, dragging = false, dragX = 0, dragStart = 0;
  let panels = [], parallaxImgs = [];

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });
  tl.to(".pv__bg", { yPercent: -100, duration: 0.9 })
    .to(viewport, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3")
    .to([".pv__head", ".pv__progress", ".pv__hint"], { opacity: 1, duration: 0.5 }, "-=0.4");

  function render(i) {
    const p = PROJECTS[i], next = PROJECTS[(i + 1) % PROJECTS.length];
    idx = i;
    nameEl.textContent = p.title;
    counterEl.textContent = `${String(i + 1).padStart(2, "0")} / ${String(PROJECTS.length).padStart(2, "0")}`;
    const facts = Object.entries(p.facts).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    // Interleave: images, with the remaining paragraphs set as quiet text columns between them.
    const rest = p.paras.slice(1);
    const textPanel = para => `<section class="pv__panel pv__note">${para.h ? `<h4>${para.h}</h4>` : ""}<p>${para.t}</p></section>`;
    const imgPanel = (g, n) => {
      const ar = g.w / g.h, kind = ar < 0.9 ? "tall" : ar > 1.45 ? "wide" : "std";
      return `<section class="pv__panel pv__image pv__image--${kind}" style="--ar:${ar.toFixed(3)}">
        <figure><img src="${g.src}" alt="${g.caption}" loading="lazy" decoding="async" data-px /></figure>
        <figcaption><b>${String(n + 1).padStart(2, "0")}</b>${g.caption}</figcaption>
      </section>`;
    };
    const gal = p.gallery.slice(1);
    let body = "", ti = 0;
    const every = Math.max(1, Math.round(gal.length / Math.max(1, rest.length)));
    gal.forEach((g, n) => {
      body += imgPanel(g, n + 1);
      if ((n + 1) % every === 0 && ti < rest.length) body += textPanel(rest[ti++]);
      if (n === 1 && p.video) body += `<section class="pv__panel pv__image pv__image--tall pv__video" style="--ar:0.5625"><figure><video src="${p.video.src}" poster="${p.video.poster}" muted loop playsinline preload="none"></video></figure><figcaption><b>Film</b>${p.video.caption}</figcaption></section>`;
    });
    while (ti < rest.length) body += textPanel(rest[ti++]);
    track.innerHTML = `
      <section class="pv__panel pv__cover">
        <div class="pv__cover-img"><img src="${p.image}" alt="${p.title}" data-px /></div>
        <div class="pv__cover-text">
          <span class="pv__kicker">${p.kicker}</span>
          <h2 class="pv__title" id="pvTitle">${p.title}</h2>
          <p class="pv__sub">${[p.location, p.area, p.year].filter(Boolean).join(" · ")}</p>
        </div>
      </section>
      <section class="pv__panel pv__brief">
        <div><h3 class="pv__statement">${p.statement}</h3><dl class="pv__facts">${facts}</dl></div>
        <div><p class="pv__text">${p.paras[0].t}</p></div>
      </section>
      ${body}
      <section class="pv__panel pv__materials">
        <h3>Material palette</h3>
        <ul>${p.materials.map(m => `<li>${m}</li>`).join("")}</ul>
      </section>
      <section class="pv__panel pv__next" data-next="${next.id}">
        <div class="pv__next-img"><img src="${next.image}" alt="" loading="lazy" /></div>
        <div class="pv__next-text">
          <span class="pv__kicker">Next project</span>
          <span class="pv__next-title">${next.title}</span>
          <button class="btn pv__next-btn" data-cursor="Next"><span>Continue</span><i></i></button>
        </div>
      </section>`;
    track.querySelectorAll("video").forEach(v => { v.preload = "metadata"; v.play().catch(() => {}); });
    track.querySelectorAll("img").forEach(im => im.addEventListener("load", () => { measure(); }, { once: true }));
    panels = [...track.children];
    parallaxImgs = [...track.querySelectorAll("[data-px]")];
    track.querySelector(".pv__next").addEventListener("click", () => swap((idx + 1) % PROJECTS.length));
    target = current = 0; measure(); apply();
  }

  function measure() { max = Math.max(0, track.scrollWidth - viewport.clientWidth); }
  function apply() {
    track.style.transform = `translate3d(${-current}px,0,0)`;
    progressEl.style.transform = `scaleX(${max ? current / max : 1})`;
    // parallax: each image slides against its panel's position in the viewport
    const vw = viewport.clientWidth;
    for (const img of parallaxImgs) {
      const r = img.parentElement.getBoundingClientRect();
      const rel = (r.left + r.width / 2 - vw / 2) / vw;       // -1..1
      img.style.transform = `translate3d(${rel * -8}%,0,0)`;
    }
  }
  function loop() {
    current += (target - current) * (reduced ? 1 : 0.085);
    if (Math.abs(target - current) < 0.1) current = target;
    apply();
    raf = requestAnimationFrame(loop);
  }

  // input
  const onWheel = e => { if (!open) return; e.preventDefault(); target = clamp(target + (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * 1.1, 0, max); hint.style.opacity = 0; };
  const onDown = e => { if (!open) return; dragging = true; dragStart = e.clientX; dragX = target; viewport.setPointerCapture?.(e.pointerId); };
  const onMove = e => { if (!dragging) return; target = clamp(dragX - (e.clientX - dragStart) * 1.6, 0, max); hint.style.opacity = 0; };
  const onUp = () => { dragging = false; };
  const onKey = e => {
    if (!open) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") target = clamp(target + innerWidth * 0.6, 0, max);
    if (e.key === "ArrowLeft") target = clamp(target - innerWidth * 0.6, 0, max);
  };
  window.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => { if (open) { measure(); target = clamp(target, 0, max); } });

  function swap(i) {
    const t = gsap.timeline();
    t.to(viewport, { opacity: 0, duration: 0.4, ease: "power2.in" })
      .add(() => { render(i); history.replaceState(null, "", `#project-${PROJECTS[i].id}`); })
      .fromTo(viewport, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
  }

  function openView(id) {
    const i = Math.max(0, PROJECTS.findIndex(p => p.id === id));
    render(i);
    open = true;
    root.classList.add("is-open"); root.setAttribute("aria-hidden", "false");
    hint.style.opacity = "";
    onOpen?.();
    tl.timeScale(1).play(0);
    if (!raf) loop();
    history.replaceState(null, "", `#project-${PROJECTS[i].id}`);
  }
  function close() {
    if (!open) return;
    open = false;
    tl.timeScale(1.5).reverse().eventCallback("onReverseComplete", () => {
      root.classList.remove("is-open"); root.setAttribute("aria-hidden", "true");
      cancelAnimationFrame(raf); raf = null;
      onClose?.();
    });
    history.replaceState(null, "", " ");
  }
  $("#pvClose").addEventListener("click", close);

  return { open: openView, close, isOpen: () => open };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
