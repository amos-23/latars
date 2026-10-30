document.getElementById("year").textContent = new Date().getFullYear();

// Live West Africa Time clock
const clock = document.getElementById("clock");
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const tickClock = () => { clock.textContent = timeFormat.format(new Date()); };
tickClock();
setInterval(tickClock, 1000);

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

// Wordmark: each letter's weight swells as the cursor gets close.
// With no cursor around, a slow wave runs through the letters instead.
const letters = [...document.querySelectorAll(".wordmark span")];
const weights = letters.map(() => 100);
const pointer = { x: 0, y: 0, lastMove: -Infinity };

addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.lastMove = performance.now();
});

function animateWordmark(now) {
  const idle = now - pointer.lastMove > 1800;
  letters.forEach((letter, i) => {
    let target;
    if (idle) {
      target = 100 + 800 * Math.max(0, Math.sin(now / 900 - i * 0.6)) ** 3;
    } else {
      const r = letter.getBoundingClientRect();
      const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
      target = 100 + 800 * Math.max(0, 1 - d / (innerWidth * 0.28));
    }
    weights[i] += (target - weights[i]) * 0.12;
    letter.style.fontWeight = Math.round(weights[i]);
  });
  requestAnimationFrame(animateWordmark);
}
if (!reduceMotion) requestAnimationFrame(animateWordmark);

// Cursor dot and project preview that trails it
if (finePointer) {
  const cursor = document.querySelector(".cursor");
  const preview = document.querySelector(".preview");
  const images = [...preview.querySelectorAll("img")];
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const trail = { ...pos };

  addEventListener("pointermove", (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    cursor.classList.remove("is-hidden");
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });

  (function follow() {
    trail.x += (pos.x - trail.x) * 0.14;
    trail.y += (pos.y - trail.y) * 0.14;
    const w = preview.offsetWidth;
    const h = preview.offsetHeight;
    preview.style.transform = `translate(${trail.x - w / 2}px, ${trail.y - h - 24}px)`;
    requestAnimationFrame(follow);
  })();

  document.querySelectorAll(".row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      images.forEach((img) => img.classList.toggle("is-active", img.dataset.project === row.dataset.project));
      preview.classList.add("is-on");
      cursor.classList.add("is-big");
    });
    row.addEventListener("mouseleave", () => {
      preview.classList.remove("is-on");
      cursor.classList.remove("is-big");
    });
  });

  document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
  document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));
}
