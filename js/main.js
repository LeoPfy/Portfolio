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
  // Warten, bis jedes Bild geladen ist (oder fehlgeschlagen – dann hängt nichts)
  const geladen = (img) => img.complete ? Promise.resolve() : new Promise((fertig) => { img.onload = img.onerror = fertig; });
  return Promise.all(bilder.map(geladen)).then(() => bilder);
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

// ---------- Cover ----------
// Beim ersten Besuch: Gummiband springt weg, der Umschlag klappt nach links auf.
// Auf Klick sofort, sonst nach einem kurzen Moment von selbst.
function coverAufklappen() {
  const html = document.documentElement;
  if (!html.classList.contains("mit-cover")) return Promise.resolve();

  return new Promise((fertig) => {
    const cover = document.querySelector(".cover");
    let offen = false;
    const oeffnen = () => {
      if (offen) return;
      offen = true;
      try { sessionStorage.setItem("cover-gesehen", "1"); } catch (_) {}
      gsap.timeline({
        onComplete: () => {
          html.classList.remove("mit-cover");
          fertig();
        },
      })
        .to(".cover__hinweis", { opacity: 0, duration: 0.2 })
        .to(".cover__gummi", { x: 60, rotation: 25, opacity: 0, duration: 0.35, ease: "back.in(2)" }, 0)
        .to(".cover__deckel", { rotationY: -165, duration: 1.1, ease: "power2.inOut" }, 0.25)
        .to(cover, { opacity: 0, duration: 0.3 }, "-=0.3");
      // Sicherheitsnetz, falls der Browser Animationen pausiert
      setTimeout(() => { html.classList.remove("mit-cover"); fertig(); }, 2500);
    };
    cover.addEventListener("click", oeffnen);
    addEventListener("keydown", oeffnen, { once: true });
    setTimeout(oeffnen, 1400);
  });
}

// ---------- Startseite: Ablauf ----------
async function intro() {
  await coverAufklappen();
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

  const projekte = (await ladeProjekte()).filter((p) => p.leine);

  const ABSTAND = 240;        // Abstand zwischen den Karten
  const DURCHHANG = 70;       // wie tief die Leine in der Mitte hängt
  const OBEN = 40;            // Höhe der Leine an den Enden

  const karten = projekte.map((p, i) => {
    const li = document.createElement("li");
    li.className = "karte";
    li.innerHTML = `
      <img class="karte__klammer" src="assets/img/deko/klammer-${(i % 2) + 1}.png" alt="">
      <a href="projekt.html?p=${p.slug}" draggable="false">
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
  const laschen = [...document.querySelectorAll(".lasche")];
  const idVon = (l) => l.dataset.abschnitt || l.getAttribute("href").replace("#", "");
  const abschnitte = laschen.map((l) => document.getElementById(idVon(l)));

  // Aktiv ist der letzte Abschnitt, dessen Anfang schon über der Bildschirmmitte liegt
  function aktualisieren() {
    let aktiv = abschnitte[0];
    abschnitte.forEach((a) => {
      if (a && a.getBoundingClientRect().top < innerHeight / 2) aktiv = a;
    });
    laschen.forEach((l) => l.classList.toggle("ist-aktiv", idVon(l) === aktiv.id));
  }
  addEventListener("scroll", aktualisieren, { passive: true });
  aktualisieren();
}

// ---------- Projektdaten ----------
// Alle Projekte stehen in data/projekte.json (später vom CMS gepflegt).
let projektCache = null;
function ladeProjekte() {
  projektCache ??= fetch("data/projekte.json").then((r) => r.json());
  return projektCache;
}

// Text sicher ins HTML einsetzen (keine Sonderzeichen-Überraschungen)
function sicher(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Kleine Zufallsschräglage, aber für jedes Projekt immer gleich
function schraeglage(slug, max = 3) {
  let h = 0;
  for (const z of slug) h = (h * 31 + z.charCodeAt(0)) % 1000;
  return ((h / 1000) * 2 - 1) * max;
}

// ---------- Projekte-Seite: eingeklebte Karten + Filter ----------
async function projektListe() {
  const liste = document.querySelector(".zeug__liste");
  const reiter = document.querySelector(".filter-reiter");
  const leer = document.querySelector(".zeug__leer");
  const projekte = await ladeProjekte();

  projekte.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "zettel";
    li.dataset.kategorie = p.kategorie;
    li.style.setProperty("--r", `${schraeglage(p.slug)}deg`);
    li.innerHTML = `
      <a href="projekt.html?p=${encodeURIComponent(p.slug)}">
        <span class="eingeklebt zettel__bild">
          <img class="klebeband" src="assets/img/deko/klebeband-${(i % 3) + 1}.png" alt="">
          <img src="${p.bild}" alt="" loading="lazy">
        </span>
        <span class="zettel__titel">${sicher(p.titel)}</span>
        <span class="zettel__notiz">${sicher(p.notiz)} · ${p.jahr}</span>
      </a>`;
    liste.append(li);
  });

  // Filter-Knöpfe aus den vorhandenen Kategorien
  const kategorien = ["Alles", ...new Set(projekte.map((p) => p.kategorie))];
  kategorien.forEach((k) => {
    const anzahl = k === "Alles" ? projekte.length : projekte.filter((p) => p.kategorie === k).length;
    const knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "filter-reiter__knopf";
    knopf.dataset.kategorie = k;
    knopf.setAttribute("aria-pressed", k === "Alles");
    knopf.innerHTML = `${k} <span class="filter-reiter__anzahl">${anzahl}</span>`;
    reiter.append(knopf);
  });

  // Gewählte Kategorie auch in der Adresse merken (?kategorie=Animation)
  const start = new URLSearchParams(location.search).get("kategorie");
  if (start && kategorien.includes(start)) filtern(start, false);

  reiter.addEventListener("click", (e) => {
    const knopf = e.target.closest("button");
    if (knopf) filtern(knopf.dataset.kategorie, true);
  });

  function filtern(kategorie, animiert) {
    reiter.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.kategorie === kategorie));
    const url = new URL(location);
    kategorie === "Alles" ? url.searchParams.delete("kategorie") : url.searchParams.set("kategorie", kategorie);
    history.replaceState(null, "", url);

    const zettel = [...liste.children];
    const zustand = animiert ? Flip.getState(zettel) : null;
    zettel.forEach((z) => (z.hidden = kategorie !== "Alles" && z.dataset.kategorie !== kategorie));
    leer.hidden = zettel.some((z) => !z.hidden);

    // Flip: Karten rutschen an ihren neuen Platz, neue ploppen rein, alte schrumpfen weg
    if (zustand) {
      Flip.from(zustand, {
        duration: 0.6,
        ease: "power3.inOut",
        stagger: 0.03,
        absolute: true,
        onEnter: (el) => gsap.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }),
        onLeave: (el) => gsap.to(el, { opacity: 0, scale: 0.6, duration: 0.3 }),
      });
    }
  }
}

// ---------- Projekt-Detailseite ----------
async function projektDetail() {
  const projekte = await ladeProjekte();
  const slug = new URLSearchParams(location.search).get("p");
  const index = projekte.findIndex((p) => p.slug === slug);
  const seite = document.querySelector(".projekt");

  if (index < 0) {
    seite.querySelector(".projekt__titel").textContent = "Hoppla, das gibt’s nicht";
    seite.querySelector(".projekt__text").innerHTML = '<p>Dieses Projekt ist nicht (mehr) im Heft. <a href="projekte.html">Zurück zum Zeug</a></p>';
    seite.querySelector(".projekt__hauptbild").hidden = true;
    seite.querySelector(".naechstes").hidden = true;
    return;
  }

  const p = projekte[index];
  document.title = `${p.titel} – Leo Pfyl`;
  seite.querySelector(".projekt__titel").textContent = p.titel;
  seite.querySelector(".projekt__notiz").textContent = p.notiz;

  // Infos: nur anzeigen, was vorhanden ist
  const infos = { Jahr: p.jahr, Kategorie: p.kategorie, Tools: p.tools, "Für": p.auftraggeber };
  seite.querySelector(".projekt__infos").innerHTML = Object.entries(infos)
    .filter(([, wert]) => wert)
    .map(([name, wert]) => `<div><dt>${name}</dt><dd>${sicher(String(wert))}</dd></div>`)
    .join("");

  // Hauptbild oder Video
  const haupt = seite.querySelector(".projekt__hauptbild");
  haupt.insertAdjacentHTML(
    "beforeend",
    p.video
      ? `<video src="${p.video}" poster="${p.bild}" controls loop muted playsinline></video>`
      : `<img src="${p.bild}" alt="${sicher(p.titel)}">`
  );

  seite.querySelector(".projekt__text").innerHTML = (p.beschreibung || "")
    .split("\n")
    .filter(Boolean)
    .map((absatz) => `<p>${sicher(absatz)}</p>`)
    .join("");

  const galerie = (bilder) =>
    bilder
      .map((src, i) => `
        <figure class="eingeklebt" style="--r: ${i % 2 ? 2 : -2}deg">
          <img class="klebeband" src="assets/img/deko/klebeband-${(i % 3) + 1}.png" alt="">
          <img src="${src}" alt="" loading="lazy">
        </figure>`)
      .join("");

  seite.querySelector(".projekt > .projekt__galerie").innerHTML = galerie(p.bilder || []);
  if (p.skizzen?.length) {
    const skizzen = seite.querySelector(".projekt__skizzen");
    skizzen.hidden = false;
    skizzen.querySelector(".projekt__galerie").innerHTML = galerie(p.skizzen);
  }

  const naechstes = projekte[(index + 1) % projekte.length];
  const link = seite.querySelector(".naechstes");
  link.href = `projekt.html?p=${encodeURIComponent(naechstes.slug)}`;
  link.querySelector(".naechstes__titel").textContent = naechstes.titel;
}

// ---------- Kritzel-Übergang ----------
// Beim Wechsel auf eine andere Seite malt ein roter Kritzelstrich den
// Bildschirm voll. Die neue Seite startet zugekritzelt und wird wieder frei.
function uebergaenge() {
  const pfad = document.querySelector(".uebergang path");

  // Ankommen: Kritzel wegwischen
  if (document.documentElement.classList.contains("kommt-an")) {
    sessionStorage.removeItem("uebergang");
    const frei = () => document.documentElement.classList.remove("kommt-an");
    gsap.fromTo(pfad, { strokeDashoffset: 0 }, { strokeDashoffset: -1, duration: 0.7, ease: "power2.inOut", delay: 0.1, onComplete: frei });
    setTimeout(frei, 1500);   // Sicherheitsnetz wie oben
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const ziel = new URL(link.href, location);
    // nur interne Links auf eine andere Seite (Sprünge auf derselben Seite scrollen normal)
    if (ziel.origin !== location.origin || link.target === "_blank") return;
    if (ziel.pathname === location.pathname && ziel.search === location.search) return;

    e.preventDefault();
    document.documentElement.classList.add("geht-weg");
    let weg = false;
    const los = () => {
      if (weg) return;
      weg = true;
      try { sessionStorage.setItem("uebergang", "1"); } catch (_) {}
      location.href = ziel.href;
    };
    gsap.fromTo(pfad, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.in", onComplete: los });
    // Sicherheitsnetz: falls der Browser Animationen pausiert (z. B. Tab im Hintergrund)
    setTimeout(los, 1000);
  });

  // Zurück-Knopf des Browsers: Seite aus dem Cache nicht zugekritzelt lassen
  addEventListener("pageshow", (e) => {
    if (e.persisted) {
      document.documentElement.classList.remove("geht-weg", "kommt-an");
      gsap.set(pfad, { strokeDashoffset: 1 });
    }
  });
}

// ---------- Winkende Figur ----------
// Tauscht im <img> die 6 Hallo-Frames durch. Das erste Frame ist sofort
// sichtbar (steht im HTML), die anderen werden im Hintergrund vorgeladen.
function winkFigur(img) {
  const ordner = "assets/img/figuren/hallo";
  const quellen = [1, 2, 3, 4, 5, 6].map((n) => `${ordner}/${String(n).padStart(3, "0")}.png`);
  quellen.forEach((src) => (new Image().src = src));

  let timer = null;
  let i = 0;
  const figur = {
    start() {
      if (timer) return;
      timer = setInterval(() => (img.src = quellen[(i = (i + 1) % quellen.length)]), 1000 / 13);   // 13 fps wie in Procreate
    },
    stopp() {
      clearInterval(timer);
      timer = null;
      i = 0;
      img.src = quellen[0];
    },
    // ein paar Mal winken und wieder aufhören
    winken(dauer = 2000) {
      figur.start();
      setTimeout(figur.stopp, dauer);
    },
  };
  return figur;
}

function ichFigur() {
  const img = document.querySelector(".ich__figur");
  const figur = winkFigur(img);
  img.addEventListener("pointerenter", figur.start);
  img.addEventListener("pointerleave", figur.stopp);
  img.addEventListener("click", () => figur.winken(1500));   // Handy: antippen

  // Winkt von selbst, sobald man zum ersten Mal hinscrollt
  new IntersectionObserver(([e], beobachter) => {
    if (!e.isIntersecting) return;
    figur.winken(2200);
    beobachter.disconnect();
  }, { threshold: 0.6 }).observe(img);
}

// ---------- Mail-Adresse ----------
// Im HTML steht die Adresse nur zerlegt (data-name, data-domain), damit
// Spam-Bots sie nicht einfach auslesen. Hier wird der echte Link gebaut.
function mailLink() {
  document.querySelectorAll(".post__mail").forEach((link) => {
    const adresse = `${link.dataset.name}@${link.dataset.domain}`;
    link.href = `mailto:${adresse}`;
    link.textContent = adresse;
  });
}

// ---------- Tusche-Spur am Mauszeiger ----------
// Der Mauszeiger zieht eine Tuschelinie hinter sich her, die langsam verblasst.
// Langsam bewegen = dicker Strich, schnell = dünn, wie bei einem Pinselstift.
function tuscheSpur() {
  // nur mit echter Maus, nicht auf Touch-Geräten
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "tusche";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const LEBENSDAUER = 700;   // ms, bis ein Stück der Linie verschwunden ist
  let punkte = [];
  let laeuft = false;

  function groesse() {
    const dpr = devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  groesse();
  addEventListener("resize", groesse);

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const letzter = punkte[punkte.length - 1];
    const jetzt = performance.now();
    const tempo = letzter ? Math.hypot(e.clientX - letzter.x, e.clientY - letzter.y) / Math.max(1, jetzt - letzter.t) : 0;
    punkte.push({ x: e.clientX, y: e.clientY, t: jetzt, breite: Math.max(0.8, 3.2 - tempo * 1.2) });
    if (!laeuft) {
      laeuft = true;
      requestAnimationFrame(zeichnen);
    }
  }, { passive: true });

  // Verlässt die Maus das Fenster, soll die Linie nicht quer zum Wiedereinstieg springen
  document.documentElement.addEventListener("mouseleave", () => punkte.push(null));

  function zeichnen() {
    const jetzt = performance.now();
    punkte = punkte.filter((p) => p === null || jetzt - p.t < LEBENSDAUER);
    while (punkte[0] === null) punkte.shift();   // Lücken am Anfang braucht es nicht mehr
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = "round";
    for (let i = 1; i < punkte.length; i++) {
      const a = punkte[i - 1], b = punkte[i];
      if (!a || !b) continue;
      const alter = (jetzt - b.t) / LEBENSDAUER;
      ctx.strokeStyle = `rgba(26, 26, 26, ${0.55 * (1 - alter)})`;
      ctx.lineWidth = b.breite * (1 - alter * 0.6);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (punkte.some(Boolean)) requestAnimationFrame(zeichnen);
    else {
      punkte = [];
      laeuft = false;
    }
  }
}

// ---------- Kritzeleien zeichnen sich selbst ----------
// Unterstreichungen der Notizen und Randkritzel werden gezeichnet,
// sobald sie ins Bild kommen.
function kritzeln() {
  // Bewusst über die Position im Fenster und nicht mit IntersectionObserver:
  // die Randkritzel sind per clip-path unsichtbar und würden sonst nie "gesehen".
  const offen = new Set(document.querySelectorAll(".notiz, .randkritzel"));
  function pruefen() {
    offen.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.85 && r.bottom > 0) {
        el.classList.add("ist-gezeichnet");
        offen.delete(el);
      }
    });
    if (!offen.size) removeEventListener("scroll", pruefen);
  }
  addEventListener("scroll", pruefen, { passive: true });
  pruefen();
}

// ---------- Bilder werden hingeklebt ----------
// Beim Scrollen fallen Bilder leicht schräg aufs Papier, dann klatscht das Klebeband drauf.
function hinkleben() {
  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll(".foto, .zettel, .eingeklebt:not(.zettel__bild)").forEach((el) => {
    const band = el.querySelectorAll(".klebeband, .foto__klebeband");
    gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } })
      .from(el, { y: -50, rotation: 9, scale: 1.08, opacity: 0, duration: 0.6, ease: "back.out(1.4)" })
      .from(band, { scale: 1.8, opacity: 0, duration: 0.25, ease: "power4.in" }, "-=0.1");
  });
}

// ---------- Fehlerseite: Animation in Endlosschleife ----------
async function fehlerKino() {
  const canvas = document.querySelector(".fehlerseite__kino");
  const ctx = canvas.getContext("2d");
  const frames = await ladeFrames(canvas.dataset.frames, Number(canvas.dataset.anzahl));
  canvas.width = frames[0].naturalWidth;
  canvas.height = frames[0].naturalHeight;
  let i = 0;
  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[i], 0, 0);
    i = (i + 1) % frames.length;
  }, 1000 / Number(canvas.dataset.fps));
}

// ---------- Start ----------
lineBoil();
uebergaenge();
kritzeln();
tuscheSpur();
if (document.querySelector(".fehlerseite__kino")) fehlerKino();

if (document.querySelector(".schriftzug")) {
  waescheleine();
  daumenkinos();
  aktiveLasche();
  intro();
  ichFigur();
  mailLink();
  hinkleben();
  // Sprung auf einen Abschnitt (z. B. index.html#post): erst springen,
  // wenn ScrollTrigger die Daumenkinos fertig eingerichtet hat
  if (location.hash) {
    addEventListener("load", () => {
      ScrollTrigger.refresh();
      document.querySelector(location.hash)?.scrollIntoView({ behavior: "instant" });
    });
  }
}
if (document.querySelector(".zeug__liste")) {
  gsap.registerPlugin(Flip);
  projektListe().then(hinkleben);
}
if (document.querySelector(".projekt")) projektDetail().then(hinkleben);
