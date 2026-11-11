# Was noch fehlt

> Stand: 11.11.2026 · Abgabe: Januar 2027
> Erledigtes abhaken: `[ ]` → `[x]`

## Von Leo (braucht Zeichnungen, Texte oder Entscheide)

- [ ] **Mauszeiger-Design:** Wie soll der eigene Mauszeiger aussehen? (Bleistift war nicht gewünscht.) Ideen: Tuscheklecks, kleiner Kreis, Mini-Figur, Pinselspitze. Am besten selber zeichnen → PNG transparent, ca. 128 × 128 px, Spitze/Mittelpunkt angeben. Evtl. eine zweite Version für „über einem Link“.
- [ ] **Echte Projekte (ca. 15)** in `zeichnungen/projekte/`, pro Projekt:
  - Titelbild (JPG/PNG, min. 1600 px lang)
  - weitere Bilder und/oder Video (MP4)
  - Prozess-Skizzen (für „Aus dem Skizzenbuch“)
  - Titel, kurze Notiz, Jahr, Kategorie (Animation · Plakate · Illustration · Web), Beschreibung, Tools, Auftraggeber
  - welche 5–6 an die Wäscheleine sollen
- [ ] **Animations-Vorschau beim Hover:** pro Animation ein kurzes MP4 (Loop, 3–5 Sek., ohne Ton)
- [ ] **Texte:** Untertitel Startseite, „Über mich“ (grauer Platzhalter), Notizen der Daumenkinos (falls ändern)
- [ ] **Mail-Adresse für „Post“:** Platzhalter ist `hallo@leopfyl.ch` → bestätigen und bei Hostpoint einrichten, oder andere Adresse nennen
- [ ] **Eigene Handschrift-Schrift:** Vorlage ausfüllen (Claude schickt sie), ersetzt „Permanent Marker“
- [ ] *Optional:* Klebestreifen mit halbtransparenter grauer Füllung (30–40 %)
- [ ] *Optional:* 3–6 Frames der zeichnenden Figur → Footer animiert

## Von Claude (kann direkt gebaut werden)

- [ ] **Eigener Mauszeiger** einbauen, sobald das Design steht
- [ ] **Online stellen:** GitHub Action lädt bei jedem Push per SFTP auf Hostpoint (`www/leopfyl.ch`); Leo trägt die Zugangsdaten als GitHub Secrets ein
- [ ] **Bilder für echte Projekte** aufbereiten (Skript `tools/bilder-aufbereiten.ps1` erweitern) und in `data/projekte.json` eintragen
- [ ] **Animations-Vorschau beim Hover** auf der Projekte-Seite einbauen
- [ ] **Handschrift-Schrift:** Vorlage erstellen, danach Schrift einbinden
- [ ] **Handy-Ansicht** gründlich testen und verbessern (Wäscheleine, Daumenkinos, Cover, Laschen)
- [ ] **CMS** unter `leopfyl.ch/admin` (PHP + MySQL, Login, Projekte hinzufügen/bearbeiten/sortieren, Bilder hochladen) – erst wenn die Seite steht
- [ ] **Feinschliff:** Ladezeiten (Bilder verkleinern/WebP), Suchmaschinen-Infos (Titel, Beschreibung, Vorschaubild für Social Media), Barrierefreiheit prüfen
- [ ] **Dokumentation** für den Leistungsnachweis (Aufbau, Technik, was wie funktioniert)

## Erledigt

- [x] WordPress, alte Datenbank und altes Repo gelöscht
- [x] Konzept, Zeichenliste, Repo mit GitHub Desktop
- [x] Liniertes Papier, roter Rand, Register-Laschen, Line Boil
- [x] Cover, das beim ersten Besuch aufklappt
- [x] Schriftzug „Leo Pfyl“ zeichnet sich selbst
- [x] Wäscheleine mit schaukelnden Karten (Platzhalter)
- [x] Daumenkinos: Nase (Startseite) und Glas (vor Kontakt)
- [x] Über mich mit Foto und winkender Figur
- [x] Kontakt: Mail-Link (mit Spamschutz) + Instagram + LinkedIn
- [x] Projekte-Seite mit Filter, Projekt-Detailseite, Kritzel-Übergang
- [x] Hinkleben beim Scrollen, Randkritzel, gezeichnete Unterstreichungen
- [x] Tusche-Spur am Mauszeiger
- [x] 404-Seite mit Kacke-Animation

## Verworfen

- Kontaktformular (ersetzt durch Mail-Link)
- Papierschnipsel mit Tiefe, Skizzenstapel zum Wegwerfen
- Bleistift als Mauszeiger
- Geräusche und englische Version (vorerst)
