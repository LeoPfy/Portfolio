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

// ---------- Wäscheleine ----------
// Die Karten hängen an einer durchhängenden Leine und schaukeln wie ein Pendel.
// Anstösse kommen von der Maus, vom Ziehen an der Leine und vom Scrollen.
async function waescheleine() {
  const leine = document.querySelector(".leine");
  const spur = leine.querySelector(".leine__spur");
  const seil = leine.querySelector(".leine__seil path");

  const projekte = (await fetch("data/projekte.json").then((r) => r.json())).filter((p) => p.leine);

  const ABSTAND = 240;        // Abstand zwischen den Karten
  const DURCHHANG = 70;       // wie tief die Leine in der Mitte hängt
  const OBEN = 40;            // Höhe der Leine an den Enden

  const karten = projekte.map((p, i) => {
    const li = document.createElement("li");
    li.className = "karte";
    li.innerHTML = `
      <img class="karte__klammer" src="assets/img/deko/klammer-${(i % 2) + 1}.png" alt="">
      <a href="#zeug" draggable="false">
        <img class="karte__bild" src="${p.bild}" alt="" draggable="false">
        <span class="karte__titel">${p.titel}</span>
        <span class="karte__notiz">${p.notiz}</span>
      </a>`;
    spur.append(li);
    return { el: li, x: i * ABSTAND, winkel: (Math.random() - 0.5) * 20, tempo: 0 };
  });

  let breite = leine.clientWidth;
  const spurBreite = (karten.length - 1) * ABSTAND;
  let verschiebung = 0;       // wie weit die Leine seitlich gezogen ist
  let schwung = 0;            // Tempo beim Loslassen (läuft aus)
  let zieht = false;

  // Startposition: Karten mittig, wenn sie Platz haben, sonst am linken Rand
  const minVerschiebung = () => Math.min(80, breite - spurBreite - 120);
  const maxVerschiebung = () => Math.max(120, (breite - spurBreite) / 2);
  verschiebung = spurBreite < breite - 200 ? (breite - spurBreite) / 2 : 110;

  // Höhe der Leine an einer Stelle x (Parabel)
  const seilY = (x) => {
    const t = Math.min(1, Math.max(0, x / breite));
    return OBEN + DURCHHANG * 4 * t * (1 - t);
  };

  function seilZeichnen() {
    seil.setAttribute("d", `M -10 ${OBEN} Q ${breite / 2} ${OBEN + DURCHHANG * 2} ${breite + 10} ${OBEN}`);
  }

  // Ziehen an der Leine
  let startX = 0, letztesX = 0, letzteZeit = 0, gezogenWeit = false;
  leine.addEventListener("pointerdown", (e) => {
    zieht = true;
    gezogenWeit = false;
    startX = letztesX = e.clientX;
    letzteZeit = performance.now();
    schwung = 0;
    leine.setPointerCapture(e.pointerId);
    leine.classList.add("ist-gezogen");
  });
  leine.addEventListener("pointermove", (e) => {
    const dx = e.clientX - letztesX;
    if (zieht) {
      const jetzt = performance.now();
      verschiebung += dx;
      schwung = dx / Math.max(1, jetzt - letzteZeit) * 16;
      letzteZeit = jetzt;
      if (Math.abs(e.clientX - startX) > 5) gezogenWeit = true;
      karten.forEach((k) => (k.tempo -= dx * 0.6));
    } else {
      // Maus streift die Karten: die in der Nähe bekommen einen Schubs
      const rand = leine.getBoundingClientRect().left;
      karten.forEach((k) => {
        const abstand = Math.abs(rand + k.x + verschiebung - e.clientX);
        if (abstand < 110) k.tempo += dx * 0.5 * (1 - abstand / 110);
      });
    }
    letztesX = e.clientX;
  });
  const loslassen = () => {
    zieht = false;
    leine.classList.remove("ist-gezogen");
  };
  leine.addEventListener("pointerup", loslassen);
  leine.addEventListener("pointercancel", loslassen);
  // Nach dem Ziehen soll kein Link aufgehen
  leine.addEventListener("click", (e) => { if (gezogenWeit) e.preventDefault(); }, true);

  // Mit der Tastatur zu einer Karte springen: Leine so schieben, dass sie sichtbar ist
  karten.forEach((k) => {
    k.el.querySelector("a").addEventListener("focus", () => {
      leine.scrollLeft = 0;
      if (k.x + verschiebung < 100 || k.x + verschiebung > breite - 100) {
        verschiebung = breite / 2 - k.x;
      }
    });
  });

  // Scrollen schaukelt die Karten ein wenig
  let letzterScroll = scrollY;
  addEventListener("scroll", () => {
    const d = Math.max(-30, Math.min(30, scrollY - letzterScroll));   // Sprünge (z. B. Laschen-Klick) nicht übertreiben
    letzterScroll = scrollY;
    karten.forEach((k, i) => (k.tempo += d * (i % 2 ? 0.25 : -0.25)));
  }, { passive: true });

  addEventListener("resize", () => {
    breite = leine.clientWidth;
    seilZeichnen();
  });

  // Physik: jede Karte ist ein gedämpftes Pendel
  let sichtbar = false;
  new IntersectionObserver(([e]) => (sichtbar = e.isIntersecting)).observe(leine);

  let vorher = performance.now();
  function schritt(jetzt) {
    const dt = Math.min(0.05, (jetzt - vorher) / 1000);
    vorher = jetzt;

    if (!zieht) {
      verschiebung += schwung;
      schwung *= 0.92;
      // Am Ende der Leine sanft zurückfedern
      const min = minVerschiebung(), max = maxVerschiebung();
      if (verschiebung < min) verschiebung += (min - verschiebung) * 0.15;
      if (verschiebung > max) verschiebung += (max - verschiebung) * 0.15;
    }

    if (sichtbar) {
      karten.forEach((k) => {
        const beschleunigung = -60 * k.winkel - 3.2 * k.tempo;
        k.tempo += beschleunigung * dt;
        k.winkel += k.tempo * dt;
        k.winkel = Math.max(-50, Math.min(50, k.winkel));
        const x = k.x + verschiebung;
        k.el.style.transform = `translate(${x - 90}px, ${seilY(x) + 4}px) rotate(${k.winkel}deg)`;
      });
    }
    requestAnimationFrame(schritt);
  }
  seilZeichnen();
  requestAnimationFrame(schritt);
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
waescheleine();
daumenkinos();
aktiveLasche();
intro();
