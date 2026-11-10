// ==========================================================================
// Skizzenbuch – Animationen
// ==========================================================================

// ---------- Line Boil ----------
// Alle Elemente mit filter: url(#boil-0) bekommen reihum leicht andere
// Verzerrungen. So "zittern" die Linien wie bei einer gezeichneten Animation.
function lineBoil() {
  const elemente = [...document.querySelectorAll("*")].filter(
    (el) => getComputedStyle(el).filter.includes("boil")
  );
  let bild = 0;
  setInterval(() => {
    bild = (bild + 1) % 3;
    elemente.forEach((el) => (el.style.filter = `url(#boil-${bild})`));
  }, 140);
}

// ---------- Bildfolge laden ----------
// Lädt alle Frames einer Animation (001.png, 002.png, ...) und wartet,
// bis sie bereit sind.
function ladeFrames(ordner, anzahl) {
  const bilder = [];
  for (let i = 1; i <= anzahl; i++) {
    const img = new Image();
    img.src = `${ordner}/${String(i).padStart(3, "0")}.png`;
    bilder.push(img);
  }
  return Promise.all(bilder.map((img) => img.decode().catch(() => {}))).then(() => bilder);
}

// ---------- Der Name zeichnet sich selbst ----------
async function schriftzug() {
  const canvas = document.querySelector(".schriftzug__canvas");
  const ctx = canvas.getContext("2d");
  const frames = await ladeFrames("assets/img/marke/schriftzug", 101);

  canvas.width = frames[0].naturalWidth;
  canvas.height = frames[0].naturalHeight;

  const fps = 20;
  return new Promise((fertig) => {
    let start = null;
    function zeichne(zeit) {
      if (start === null) start = zeit;
      const i = Math.min(frames.length - 1, Math.floor(((zeit - start) / 1000) * fps));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[i], 0, 0);
      if (i < frames.length - 1) requestAnimationFrame(zeichne);
      else fertig();
    }
    requestAnimationFrame(zeichne);
  });
}

// ---------- Startseite: Ablauf ----------
async function intro() {
  await schriftzug();

  gsap.to(".vorne__untertitel", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
  // Doodles "ploppen" nacheinander aufs Papier
  gsap.fromTo(
    ".vorne .doodle",
    { opacity: 0, scale: 0.4 },
    { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(3)", stagger: 0.12, delay: 0.2 }
  );
  gsap.to(".scroll-hinweis", { opacity: 1, duration: 0.6, delay: 0.8 });
}

// ---------- Aktive Register-Lasche ----------
// Die Lasche des Abschnitts, der gerade zu sehen ist, wird rot.
function aktiveLasche() {
  const laschen = document.querySelectorAll(".lasche");
  const abschnitte = [...laschen].map((l) => document.querySelector(l.getAttribute("href")));

  const beobachter = new IntersectionObserver(
    (eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        laschen.forEach((l) => l.classList.toggle("ist-aktiv", l.getAttribute("href") === `#${e.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  abschnitte.forEach((a) => a && beobachter.observe(a));
}

lineBoil();
aktiveLasche();
intro();
