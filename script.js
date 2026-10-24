// Add your live mobile app/project URL here.
const APP_URL = ""; // Example: "https://your-app-link.example"
const appLink = document.getElementById("app-link");
const appNote = document.getElementById("app-note");
if (appLink && APP_URL) {
  appLink.href = APP_URL;
  if (appNote) appNote.hidden = true;
} else if (appLink) {
  appLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (appNote) {
      appNote.textContent = "Your app link will appear here once you add it in script.js.";
      appNote.hidden = false;
    }
  });
}

// The CV page is separate. Add a PDF at assets/shvithi-cv.pdf to enable the link.
const cvLink = document.getElementById("cv-download");
const cvNote = document.getElementById("cv-note");
if (cvLink) {
  cvLink.href = "assets/shvithi-cv.pdf";
  cvLink.addEventListener("click", (event) => {
    // If no PDF is deployed yet, keep the visitor informed rather than opening a dead link.
    fetch("assets/shvithi-cv.pdf", { method: "HEAD" }).then((response) => {
      if (!response.ok) {
        event.preventDefault();
        if (cvNote) cvNote.textContent = "Add your PDF as assets/shvithi-cv.pdf, then this button will open it.";
      }
    }).catch(() => {});
  });
}

// Soft mouse trail, disabled on touch-first devices and for reduced-motion preferences.
const trailLayer = document.querySelector(".cursor-trail");
const glow = document.querySelector(".cursor-glow");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
if (trailLayer && glow && finePointer && !reduceMotion) {
  let lastStamp = 0;
  window.addEventListener("pointermove", (event) => {
    glow.style.opacity = "1";
    glow.style.left = event.clientX + "px";
    glow.style.top = event.clientY + "px";
    const now = performance.now();
    if (now - lastStamp < 24) return;
    lastStamp = now;
    const dot = document.createElement("span");
    dot.className = "trail-dot";
    dot.style.left = event.clientX + "px";
    dot.style.top = event.clientY + "px";
    trailLayer.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove(), { once: true });
  });
  document.addEventListener("pointerleave", () => { glow.style.opacity = "0"; });
}
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) { event.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
  });
});
document.querySelectorAll("#year").forEach((node) => node.textContent = new Date().getFullYear());
