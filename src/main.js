import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initHeroGL } from "./hero-gl.js";
import { PROJECTS } from "./projects.js";

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const isMobile = () => window.innerWidth <= 860;

/* ---------------------------------------------------------
   Smooth scroll (Lenis) driven by GSAP's ticker
--------------------------------------------------------- */
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

const scrollTo = (target, opts = {}) => lenis.scrollTo(target, { duration: 1.6, force: true, easing: t => 1 - Math.pow(1 - t, 4), ...opts });
$$('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    if (a.dataset.project) return; // handled by project overlay
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollTo(el);
  });
});
$("#toTop").addEventListener("click", () => scrollTo(0));

/* ---------------------------------------------------------
   Text splitting helpers
--------------------------------------------------------- */
function splitChars(el) {
  const html = [];
  el.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      html.push(wrapWords(node.textContent));
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      html.push(`<${tag}>${wrapWords(node.textContent)}</${tag}>`);
    }
  });
  el.innerHTML = html.join("");
}
function wrapWords(text) {
  return text.split(/(\s+)/).map(w => {
    if (!w.trim()) return w;
    return `<span class="word">${[...w].map(c => `<span class="char">${c}</span>`).join("")}</span>`;
  }).join("");
}
function splitWords(el) {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
}
$$("[data-split-chars]").forEach(splitChars);
$$("[data-split-words]").forEach(splitWords);

/* ---------------------------------------------------------
   Hero WebGL
--------------------------------------------------------- */
const heroGL = initHeroGL($("#heroCanvas"), "/img/hero.jpg", { reduced });

/* ---------------------------------------------------------
   Preloader → intro
--------------------------------------------------------- */
const preloader = $("#preloader");
const count = $("#preloaderCount");
const bar = $("#preloaderBar");

function runIntro() {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.to(preloader, { yPercent: -100, duration: 1.1, ease: "power4.inOut" })
    .add(() => { preloader.style.display = "none"; lenis.start(); })
    .to($$(".hero__word"), { y: 0, duration: 1.4, stagger: 0.12 }, "-=0.6")
    .to($$(".hero .reveal-line > span"), { y: 0, duration: 1.1, stagger: 0.08 }, "-=1.0")
    .to($("#header"), { y: 0, opacity: 1, duration: 1 }, "-=0.9")
    .fromTo($(".hero__scroll"), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1 }, "-=0.8");
  if (heroGL) gsap.to(heroGL.state, { intro: 1, duration: 2.2, ease: "power2.out", delay: 0.2 });
}

if (reduced) {
  preloader.style.display = "none";
  lenis.start();
  gsap.set("#header", { y: 0, opacity: 1 });
} else {
  const letters = $$(".preloader__word span");
  const prog = { v: 0 };
  const tl = gsap.timeline({ onComplete: runIntro });
  tl.to(letters, { y: 0, duration: 1, stagger: 0.05, ease: "power4.out" })
    .to(prog, {
      v: 100, duration: 1.6, ease: "power2.inOut",
      onUpdate: () => { count.textContent = String(Math.round(prog.v)).padStart(2, "0"); bar.style.width = prog.v + "%"; }
    }, "-=0.4")
    .to(letters, { y: "-110%", duration: 0.8, stagger: 0.04, ease: "power4.in" }, "-=0.2");
}

/* ---------------------------------------------------------
   Local time (Bengaluru)
--------------------------------------------------------- */
const timeEl = $("#localTime");
const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
const tick = () => { timeEl.textContent = fmt.format(new Date()); };
tick(); setInterval(tick, 15000);
$("#year").textContent = new Date().getFullYear();

/* ---------------------------------------------------------
   Custom cursor + magnetic elements
--------------------------------------------------------- */
const cursor = $("#cursor");
const cursorLabel = $(".cursor__label");
if (!isTouch && !reduced) {
  document.body.classList.add("has-cursor");
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const dot = $(".cursor__dot"), ring = $(".cursor__ring");
  const xDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
  const yDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const xRing = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const yRing = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  window.addEventListener("pointermove", e => {
    pos.x = e.clientX; pos.y = e.clientY;
    xDot(pos.x); yDot(pos.y); xRing(pos.x); yRing(pos.y);
    cursor.classList.remove("is-hidden");
  }, { passive: true });
  document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
  window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
  window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

  // hover states
  document.addEventListener("pointerover", e => {
    const labelEl = e.target.closest("[data-cursor]");
    const hoverEl = e.target.closest("a, button, .disc__row");
    if (labelEl) { cursorLabel.textContent = labelEl.dataset.cursor; cursor.classList.add("is-label"); cursor.classList.remove("is-hover"); }
    else if (hoverEl) { cursor.classList.add("is-hover"); cursor.classList.remove("is-label"); }
    else { cursor.classList.remove("is-hover", "is-label"); }
  });

  // magnetic
  $$("[data-magnetic]").forEach(el => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

/* ---------------------------------------------------------
   Menu
--------------------------------------------------------- */
const menu = $("#menu"), menuBtn = $("#menuBtn");
let menuOpen = false;
const menuTL = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });
menuTL.to(".menu__bg", { yPercent: 100, duration: 0.9 })
  .to(".menu__word", { y: 0, duration: 1, stagger: 0.06, ease: "power4.out" }, "-=0.45")
  .to(".menu__col", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "-=0.7")
  .to(".menu__image", { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power4.out" }, "-=0.9")
  .to(".menu__image img", { scale: 1, duration: 1.4, ease: "power3.out" }, "<");

function openMenu() {
  menuOpen = true;
  menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false");
  menuBtn.classList.add("is-open"); menuBtn.setAttribute("aria-expanded", "true");
  lenis.stop();
  menuTL.timeScale(1).play();
}
function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  menuBtn.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false");
  menuTL.timeScale(1.6).reverse().eventCallback("onReverseComplete", () => {
    menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true");
    if (!projectOpen) lenis.start();
  });
}
menuBtn.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeMenu(); closeProject(); } });

/* ---------------------------------------------------------
   Scroll choreography
--------------------------------------------------------- */
// Hero: title drifts & GL deepens on scroll
ScrollTrigger.create({
  trigger: "#hero", start: "top top", end: "bottom top", scrub: true,
  onUpdate: self => {
    heroGL && heroGL.setScroll(self.progress);
  }
});
gsap.to(".hero__content", {
  yPercent: 18, opacity: 0.2, ease: "none",
  scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true }
});

// Generic line reveals (outside hero)
$$(".reveal-line > span").forEach(el => {
  if (el.closest("#hero")) return;
  gsap.to(el, {
    y: 0, duration: 1.2, ease: "power4.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true }
  });
});

// Section title chars
$$(".section-title").forEach(t => {
  gsap.to($$(".char", t), {
    y: 0, duration: 1, ease: "power4.out", stagger: 0.018,
    scrollTrigger: { trigger: t, start: "top 85%", once: true }
  });
});

// Manifesto: word opacity scrubbed by scroll
gsap.to(".manifesto__text .w", {
  opacity: 1, ease: "none", stagger: 0.06,
  scrollTrigger: { trigger: ".manifesto__text", start: "top 75%", end: "bottom 45%", scrub: 0.6 }
});

// Parallax media
$$("[data-parallax]").forEach(el => {
  const amt = parseFloat(el.dataset.parallax) * 100;
  gsap.fromTo(el.firstElementChild || el, { yPercent: -amt }, {
    yPercent: amt, ease: "none",
    scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
  });
});

// Work: pinned horizontal scroll (desktop only)
// Wrap each work image: GSAP moves the wrapper, CSS scales the <img> on hover.
$$(".work__media img").forEach(img => {
  const wrap = document.createElement("div"); wrap.className = "work__img";
  img.replaceWith(wrap); wrap.appendChild(img);
});

let workST;
function buildWork() {
  if (workST) { workST.kill(); workST = null; gsap.set("#workTrack", { clearProps: "x" }); gsap.set("#workProgress", { clearProps: "all" }); }
  if (isMobile()) {
    // on mobile: simple image reveals
    $$(".work__img").forEach(w => {
      gsap.fromTo(w, { scale: 1.1 }, { scale: 1, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: w, start: "top 85%", once: true } });
    });
    return;
  }
  const track = $("#workTrack");
  const getX = () => -(track.scrollWidth - window.innerWidth);
  const tween = gsap.to(track, {
    x: getX, ease: "none",
    scrollTrigger: {
      trigger: "#workPin", start: "top top", end: () => "+=" + (track.scrollWidth - window.innerWidth + window.innerHeight * 0.4),
      pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: self => gsap.set("#workProgress", { scaleX: self.progress })
    }
  });
  workST = tween.scrollTrigger;
  // inner image parallax as cards move
  $$(".work__img").forEach(w => {
    gsap.fromTo(w, { xPercent: -5 }, {
      xPercent: 5, ease: "none",
      scrollTrigger: { trigger: w.closest(".work__card"), containerAnimation: tween, start: "left right", end: "right left", scrub: true }
    });
  });
}
buildWork();

// Stats counters
$$(".stat__num").forEach(el => {
  const target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
  const o = { v: 0 };
  gsap.to(o, {
    v: target, duration: 2, ease: "power3.out",
    onUpdate: () => { el.textContent = Math.round(o.v) + suffix; },
    scrollTrigger: { trigger: el, start: "top 85%", once: true }
  });
});

// Disciplines rows: stagger in + floating image
$$(".disc__row").forEach((row, i) => {
  gsap.from(row, { opacity: 0, y: 30, duration: 1, ease: "power3.out", delay: i * 0.05, scrollTrigger: { trigger: row, start: "top 92%", once: true } });
});
const float = $("#discFloat"), floatImg = $("img", float);
if (!isTouch) {
  const fx = gsap.quickTo(float, "x", { duration: 0.5, ease: "power3" });
  const fy = gsap.quickTo(float, "y", { duration: 0.5, ease: "power3" });
  const list = $("#discList");
  list.addEventListener("pointermove", e => { fx(e.clientX); fy(e.clientY); });
  $$(".disc__row").forEach(row => {
    row.addEventListener("pointerenter", () => {
      floatImg.src = row.dataset.img;
      gsap.to(float, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: "power3.out" });
    });
  });
  list.addEventListener("pointerleave", () => gsap.to(float, { opacity: 0, scale: 0.8, duration: 0.4, ease: "power3.in" }));
}

// Footer big words rise
gsap.to(".footer__big-word", {
  y: 0, duration: 1.4, ease: "power4.out", stagger: 0.1,
  scrollTrigger: { trigger: ".footer", start: "top 90%", once: true }
});

// Press marquee speeds up with scroll velocity
const tracks = $$(".press__track");
ScrollTrigger.create({
  onUpdate: self => {
    const v = Math.min(Math.abs(self.getVelocity()) / 1500, 2.5);
    tracks.forEach(t => (t.style.animationDuration = `${28 / (1 + v)}s`));
  }
});

/* ---------------------------------------------------------
   Project overlay
--------------------------------------------------------- */
const project = $("#project");
let projectOpen = false, currentIdx = 0;
const projTL = gsap.timeline({ paused: true, defaults: { ease: "power4.inOut" } });
projTL.to(".project__bg", { yPercent: -100, duration: 0.9 })
  .to(".project__scroller", { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.3")
  .from(".project__hero img", { scale: 1.3, duration: 1.4, ease: "power3.out" }, "<")
  .to(".project__close", { opacity: 1, duration: 0.5 }, "-=0.8");

function fillProject(idx) {
  const p = PROJECTS[idx];
  currentIdx = idx;
  $("#projectImg").src = p.image; $("#projectImg").alt = p.title;
  $("#projectEyebrow").textContent = p.eyebrow;
  $("#projectTitle").textContent = p.title;
  $("#projectText").textContent = p.text;
  $("#projectFacts").innerHTML = Object.entries(p.facts).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $(".project__scroller").scrollTop = 0;
}
function openProject(id) {
  const idx = PROJECTS.findIndex(p => p.id === id);
  if (idx < 0) return;
  fillProject(idx);
  projectOpen = true;
  project.classList.add("is-open"); project.setAttribute("aria-hidden", "false");
  lenis.stop();
  heroGL && heroGL.pause();
  projTL.timeScale(1).play(0);
  history.replaceState(null, "", `#project-${id}`);
}
function closeProject() {
  if (!projectOpen) return;
  projectOpen = false;
  projTL.timeScale(1.6).reverse().eventCallback("onReverseComplete", () => {
    project.classList.remove("is-open"); project.setAttribute("aria-hidden", "true");
    if (!menuOpen) lenis.start();
    heroGL && heroGL.resume();
  });
  history.replaceState(null, "", " ");
}
function swapProject(dir) {
  const next = (currentIdx + dir + PROJECTS.length) % PROJECTS.length;
  const tl = gsap.timeline();
  tl.to(".project__scroller", { opacity: 0, duration: 0.35, ease: "power2.in" })
    .add(() => fillProject(next))
    .fromTo(".project__hero img", { scale: 1.2 }, { scale: 1.1, duration: 1.2, ease: "power3.out" })
    .to(".project__scroller", { opacity: 1, duration: 0.5, ease: "power2.out" }, "<");
}
$$("[data-project]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); openProject(el.dataset.project); }));
$("#projectClose").addEventListener("click", closeProject);
$("#projectPrev").addEventListener("click", () => swapProject(-1));
$("#projectNext").addEventListener("click", () => swapProject(1));
// deep link
if (location.hash.startsWith("#project-")) {
  setTimeout(() => openProject(location.hash.replace("#project-", "")), reduced ? 0 : 3600);
}

/* ---------------------------------------------------------
   Resize: rebuild horizontal scroll when crossing breakpoint
--------------------------------------------------------- */
let wasMobile = isMobile();
window.addEventListener("resize", () => {
  const now = isMobile();
  if (now !== wasMobile) { wasMobile = now; buildWork(); }
  ScrollTrigger.refresh();
});
window.addEventListener("load", () => ScrollTrigger.refresh());
