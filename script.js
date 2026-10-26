// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Rotating hero word
const words = document.querySelectorAll(".rotator-word");
let current = 0;
setInterval(() => {
  const prev = words[current];
  current = (current + 1) % words.length;
  prev.classList.remove("is-active");
  prev.classList.add("is-leaving");
  words[current].classList.remove("is-leaving");
  words[current].classList.add("is-active");
  setTimeout(() => prev.classList.remove("is-leaving"), 600);
}, 2200);

// Count-up stats
function countUp(el) {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const duration = 1200;
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Scroll reveal
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Spotlight that follows the cursor on project cards
document.querySelectorAll(".project").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    card.style.setProperty("--my", `${e.clientY - rect.top}px`);
  });
});
