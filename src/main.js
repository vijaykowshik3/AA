import gsap from "gsap";
import Lenis from "lenis";
import { createScene } from "./scene.js";
import { createProjectView } from "./project-view.js";
import { PROJECTS } from "./projects.js";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const isMobile = () => innerWidth <= 860;

/* ---------------------------------------------------------
   Smooth scroll — the journey
--------------------------------------------------------- */
const lenis = new Lenis({ lerp: 0.075, smoothWheel: true, syncTouch: true });
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

/* The journey is a ring: three identical cycles of scroll length. We start in the
   middle one and silently shift by a cycle when drifting into the first or last,
   so scrolling past Contact arrives back at the Hero, and scrolling up from the
   Hero lands in Contact. Everything on screen is a function of progress mod 1. */
history.scrollRestoration = "manual";
const CYCLES = 3;
const cycle = () => document.documentElement.scrollHeight / CYCLES;
const progressOf = () => (((window.scrollY / cycle()) % 1) + 1) % 1;
const goToProgress = (p, opts = {}) => {
  const c = cycle(), y = window.scrollY, base = Math.floor(y / c) * c;
  const cands = [base + p * c, base + p * c - c, base + p * c + c].filter(v => v >= 0 && v <= c * CYCLES - innerHeight);
  const target = cands.sort((m, n) => Math.abs(m - y) - Math.abs(n - y))[0];
  lenis.scrollTo(target, { duration: 1.8, force: true, easing: t => 1 - Math.pow(1 - t, 4), ...opts });
};
function keepInMiddleCycle() {
  const c = cycle(), y = window.scrollY;
  if (y < c * 0.5) lenis.scrollTo(y + c, { immediate: true, force: true });
  else if (y > c * 2.5) lenis.scrollTo(y - c, { immediate: true, force: true });
}
lenis.scrollTo(cycle(), { immediate: true, force: true });

/* ---------------------------------------------------------
   World
--------------------------------------------------------- */
const world = createScene($("#world"), { projectImages: PROJECTS.map(p => p.image), lowPower: isMobile() || isTouch });

/* ---------------------------------------------------------
   Panels — state is a function of progress
--------------------------------------------------------- */
const panels = $$(".panel").map(el => {
  const [a, b] = el.dataset.range.split(",").map(Number);
  return { el, id: el.id, a, b, active: false, enteredOnce: false };
});
const byId = Object.fromEntries(panels.map(p => [p.id, p]));

// manifesto words
const manifesto = $(".manifesto__text");
manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
const words = $$(".manifesto__text .w");

// work
const N = PROJECTS.length;
$("#workTotal").textContent = String(N).padStart(2, "0");
const workNav = $("#workNav");
workNav.innerHTML = PROJECTS.map((p, i) => `<li><button data-work="${i}">${p.title}</button></li>`).join("");
const workNavBtns = $$("button", workNav);
let activeWork = -1;
const WORK_IN = 0.08, WORK_SPAN = 0.84;
function workProgressFor(i) { const w = byId.work; return w.a + (WORK_IN + (i / (N - 1)) * WORK_SPAN) * (w.b - w.a); }
function setWorkText(i, dir) {
  if (i === activeWork) return;
  activeWork = i;
  const p = PROJECTS[i];
  $("#workIndex").textContent = String(i + 1).padStart(2, "0");
  workNavBtns.forEach((b, k) => b.classList.toggle("is-active", k === i));
  const els = [$("#workKicker"), $("#workTitle"), $("#workLocation").parentElement];
  gsap.timeline()
    .to(els, { y: -14 * dir, opacity: 0, duration: 0.25, ease: "power2.in", stagger: 0.03 })
    .add(() => { $("#workKicker").textContent = p.kicker; $("#workTitle").textContent = p.title; $("#workLocation").textContent = p.location; $("#workYear").textContent = p.year; })
    .fromTo(els, { y: 18 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.05 });
}
workNavBtns.forEach(b => b.addEventListener("click", () => goToProgress(workProgressFor(+b.dataset.work))));

// stats
function runStats() {
  $$(".stat__num").forEach(el => {
    const o = { v: 0 }, suffix = el.dataset.suffix || "";
    gsap.to(o, { v: +el.dataset.count, duration: 2, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(o.v) + suffix; } });
  });
}

let lastProgress = 0, railBtns = $$(".rail__list button");
let booted = false;
function update() {
  keepInMiddleCycle();
  const p = progressOf();
  const dir = p >= lastProgress ? 1 : -1; lastProgress = p;
  world.setProgress(p);
  $("#railFill").style.transform = `scaleY(${p})`;

  let railActive = null;
  for (const s of panels) {
    const t = (p - s.a) / (s.b - s.a);
    const inside = (t > 0 && t < 1) || (s.id === "hero" && p === 0);
    if (inside !== s.active) { s.active = inside; s.el.classList.toggle("is-active", inside); if (inside && !s.enteredOnce) { s.enteredOnce = true; if (s.id === "studio") runStats(); } }
    if (!inside) continue;
    const tt = clamp(t, 0, 1);
    const fin = s.id === "hero" ? (booted ? smooth(0, 0.05, tt) : 1) : smooth(0, 0.14, tt);
    const fout = s.id === "contact" ? 1 - smooth(0.84, 0.97, tt) : 1 - smooth(0.86, 1, tt);
    const o = Math.min(fin, fout);
    let tr;
    if (s.id === "hero") tr = `scale(${1 + tt * 0.35}) translateY(${tt * -6}vh)`;
    else if (s.id === "contact") tr = `translateY(${(1 - fin) * 48}px) scale(${1 - (1 - fout) * 0.08})`;
    else tr = `translateY(${(1 - fin) * 48 - (1 - fout) * 48}px) scale(${1 - (1 - fout) * 0.04})`;
    s.el.style.opacity = o; s.el.style.transform = tr;
    if (s.id === "hero") s.el.style.filter = `blur(${tt * 8}px)`;
    if (tt > 0.5 || !railActive) railActive = s.id;

    if (s.id === "manifesto") {
      const lit = smooth(0.18, 0.72, tt) * words.length;
      words.forEach((w, i) => { w.style.opacity = i < lit ? 1 : 0.14; });
    }
    if (s.id === "work") {
      const sub = clamp((tt - WORK_IN) / WORK_SPAN, 0, 1);
      const cont = sub * (N - 1);
      world.setWork({ index: Math.floor(cont), local: cont - Math.floor(cont) });
      setWorkText(Math.round(cont), dir);
    }
  }
  if (!byId.work.active) world.setWork(null);
  railBtns.forEach(b => b.classList.toggle("is-active", b.dataset.goto === railActive));
}
lenis.on("scroll", update);
window.addEventListener("resize", update);

// goto links
$$("[data-goto]").forEach(el => el.addEventListener("click", e => {
  e.preventDefault();
  const s = byId[el.dataset.goto]; if (!s) return;
  closeMenu();
  const p = s.id === "hero" ? 0 : s.id === "contact" ? 1 : s.id === "work" ? workProgressFor(0) : s.a + (s.b - s.a) * 0.45;
  goToProgress(p);
}));

/* ---------------------------------------------------------
   Project view
--------------------------------------------------------- */
const pv = createProjectView({
  onOpen: () => { lenis.stop(); world.pause(); },
  onClose: () => { if (!menuOpen) lenis.start(); world.resume(); },
});
$("#workOpen").addEventListener("click", () => pv.open(PROJECTS[Math.max(0, activeWork)].id));

/* ---------------------------------------------------------
   Preloader → intro
--------------------------------------------------------- */
const preloader = $("#preloader"), count = $("#preloaderCount"), bar = $("#preloaderBar");
function runIntro() {
  gsap.timeline({ defaults: { ease: "power4.out" } })
    .to(preloader, { yPercent: -100, duration: 1.1, ease: "power4.inOut" })
    .add(() => { preloader.style.display = "none"; lenis.start(); update(); })
    .add(() => { booted = true; }, "+=1.5")
    .to($$(".hero__word"), { y: 0, duration: 1.4, stagger: 0.12 }, "-=0.6")
    .from([".hero__eyebrow", ".hero__bottom"], { opacity: 0, y: 20, duration: 1, stagger: 0.1 }, "-=1")
    .to("#header", { y: 0, opacity: 1, duration: 1 }, "-=0.9")
    .to("#rail", { opacity: 1, duration: 1 }, "-=0.8")
    .add(() => { if (location.hash.startsWith("#project-")) pv.open(location.hash.slice(9)); });
}
if (reduced) {
  preloader.style.display = "none"; lenis.start(); gsap.set(["#header", "#rail"], { y: 0, opacity: 1 }); update(); booted = true;
  if (location.hash.startsWith("#project-")) pv.open(location.hash.slice(9));
} else {
  const letters = $$(".preloader__word span"), prog = { v: 0 };
  gsap.timeline({ onComplete: runIntro })
    .to(letters, { y: 0, duration: 1, stagger: 0.05, ease: "power4.out" })
    .to(prog, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(prog.v)).padStart(2, "0"); bar.style.width = prog.v + "%"; } }, "-=0.4")
    .to(letters, { y: "-110%", duration: 0.8, stagger: 0.04, ease: "power4.in" }, "-=0.2");
}
update();

/* ---------------------------------------------------------
   Header bits
--------------------------------------------------------- */
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
const tick = () => { $("#localTime").textContent = fmt.format(new Date()); };
tick(); setInterval(tick, 15000);
$("#year").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   Menu
--------------------------------------------------------- */
const menu = $("#menu"), menuBtn = $("#menuBtn");
let menuOpen = false;
const menuTL = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });
menuTL.to(".menu__bg", { yPercent: 100, duration: 0.9 })
  .to(".menu__word", { y: 0, duration: 1, stagger: 0.06, ease: "power4.out" }, "-=0.45")
  .to(".menu__col", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "-=0.7");
function openMenu() {
  menuOpen = true; menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false");
  menuBtn.classList.add("is-open"); menuBtn.setAttribute("aria-expanded", "true");
  lenis.stop(); menuTL.timeScale(1).play();
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false; menuBtn.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false");
  menuTL.timeScale(1.6).reverse().eventCallback("onReverseComplete", () => {
    menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true");
    if (!pv.isOpen()) lenis.start();
  });
}
menuBtn.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

/* ---------------------------------------------------------
   Cursor + magnetic
--------------------------------------------------------- */
const cursor = $("#cursor"), cursorLabel = $(".cursor__label");
if (!isTouch && !reduced) {
  document.body.classList.add("has-cursor");
  const dot = $(".cursor__dot"), ring = $(".cursor__ring");
  const xDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" }), yDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const xRing = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), yRing = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  window.addEventListener("pointermove", e => { xDot(e.clientX); yDot(e.clientY); xRing(e.clientX); yRing(e.clientY); cursor.classList.remove("is-hidden"); }, { passive: true });
  document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
  document.addEventListener("pointerover", e => {
    const labelEl = e.target.closest("[data-cursor]"), hoverEl = e.target.closest("a, button, .disc__row");
    if (labelEl) { cursorLabel.textContent = labelEl.dataset.cursor; cursor.classList.add("is-label"); cursor.classList.remove("is-hover"); }
    else if (hoverEl) { cursor.classList.add("is-hover"); cursor.classList.remove("is-label"); }
    else cursor.classList.remove("is-hover", "is-label");
  });
  $$("[data-magnetic]").forEach(el => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" }), yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); xTo((e.clientX - (r.left + r.width / 2)) * 0.35); yTo((e.clientY - (r.top + r.height / 2)) * 0.35); });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });

  // disciplines floating image
  const float = $("#discFloat"), floatImg = $("img", float), list = $("#discList");
  const fx = gsap.quickTo(float, "x", { duration: 0.5, ease: "power3" }), fy = gsap.quickTo(float, "y", { duration: 0.5, ease: "power3" });
  list.addEventListener("pointermove", e => { fx(e.clientX); fy(e.clientY); });
  $$(".disc__row").forEach(row => row.addEventListener("pointerenter", () => {
    floatImg.src = row.dataset.img;
    gsap.to(float, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: "power3.out" });
  }));
  list.addEventListener("pointerleave", () => gsap.to(float, { opacity: 0, scale: 0.8, duration: 0.4, ease: "power3.in" }));
}

/* ---------------------------------------------------------
   Press marquee reacts to scroll speed
--------------------------------------------------------- */
const tracks = $$(".press__track");
lenis.on("scroll", ({ velocity }) => { const v = Math.min(Math.abs(velocity) / 40, 2.5); tracks.forEach(t => (t.style.animationDuration = `${30 / (1 + v)}s`)); });
