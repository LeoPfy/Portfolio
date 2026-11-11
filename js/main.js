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

// ---------- Daumenkino ----------
// Die Bühne bleibt stehen (pin), während man scrollt. Der Scroll-Fortschritt
// bestimmt, welches Frame gezeigt wird – vorwärts wie rückwärts.
function daumenkinos() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll(".daumenkino").forEach((kino) => {
    const buehne = kino.querySelector(".daumenkino__buehne");
    const canvas = kino.querySelector(".daumenkino__canvas");
    const ctx = canvas.getContext("2d");
    const notizen = kino.querySelectorAll(".daumenkino__notiz");
    const anzahl = Number(kino.dataset.anzahl);
    let frames = null;
    let fortschritt = 0;

    function zeichne() {
      // Notizen ein- und ausblenden
      notizen.forEach((n) => {
        const sichtbar = fortschritt >= Number(n.dataset.von) && fortschritt < Number(n.dataset.bis);
        n.classList.toggle("ist-sichtbar", sichtbar);
      });
      if (!frames) return;
      const i = Math.round(fortschritt * (anzahl - 1));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[i], 0, 0);
    }

    // Frames erst laden, wenn das Daumenkino in die Nähe kommt
    ScrollTrigger.create({
      trigger: kino,
      start: "top bottom+=100%",
      once: true,
      onEnter: async () => {
        frames = await ladeFrames(kino.dataset.frames, anzahl);
        canvas.width = frames[0].naturalWidth;
        canvas.height = frames[0].naturalHeight;
        zeichne();
      },
    });

    ScrollTrigger.create({
      trigger: kino,
      start: "top top",
      end: `+=${kino.dataset.strecke}%`,
      pin: buehne,
      scrub: true,
      onUpdate: (st) => {
        fortschritt = st.progress;
        zeichne();
      },
    });
  });
}

// ---------- Aktive Register-Lasche ----------
// Die Lasche des Abschnitts, der gerade zu sehen ist, wird rot.
function aktiveLasche() {
  const laschen = document.querySelectorAll(".lasche");
  const abschnitte = [...laschen].map((l) => document.querySelector(l.getAttribute("href")));

  // Aktiv ist der letzte Abschnitt, dessen Anfang schon über der Bildschirmmitte liegt
  function aktualisieren() {
    let aktiv = abschnitte[0];
    abschnitte.forEach((a) => {
      if (a && a.getBoundingClientRect().top < innerHeight / 2) aktiv = a;
    });
    laschen.forEach((l) => l.classList.toggle("ist-aktiv", l.getAttribute("href") === `#${aktiv.id}`));
  }
  addEventListener("scroll", aktualisieren, { passive: true });
  aktualisieren();
}

lineBoil();
daumenkinos();
aktiveLasche();
intro();
