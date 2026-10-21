# Konzept – Portfolio Leo Pfyl

> Arbeitsstand: 21.10.2026 · Abgabe: Januar 2027

## Idee in einem Satz

Die Webseite ist **ein Skizzenbuch, das lebt**: liniertes Papier, eingeklebte Arbeiten, Kritzeleien am Rand – und alles bewegt sich, als würde es gerade gezeichnet.

## Look

| | |
|---|---|
| **Papier** | liniert, wie ein Schulheft, mit **rotem Randstrich** links |
| **Farben** | Schwarz (Tusche) + Weiss (Papier) + **Rot** als Akzent (wie ein Korrekturstift) |
| **Linien** | leicht „zitternd“ (Line Boil), damit alles gezeichnet und lebendig wirkt |
| **Schrift** | Titel in **Leos eigener Handschrift** (eigene Schrift), Fliesstext in einer gut lesbaren Schrift |
| **Tonalität** | locker und witzig, Du-Form |
| **Sprache** | nur Deutsch |
| **Fokus** | Desktop zuerst, Handy funktioniert aber auch |

## Buch-Gefühl (Mix aus Buch und Scrollen)

- **Cover:** Beim ersten Besuch liegt ein geschlossenes Skizzenbuch da. Der Umschlag klappt auf.
- **Register-Laschen rechts:** Zettel, die seitlich aus dem Buch ragen – das ist die Navigation. Klick = blättert dorthin.
- **Übergänge:** Beim Seitenwechsel malt ein roter Kritzelstrich den Bildschirm voll und gibt die neue Seite frei – wie Umblättern.
- **Dazwischen** wird ganz normal gescrollt.

### Register-Laschen (Arbeitstitel – Texte schreibt Leo)

| Lasche | führt zu |
|---|---|
| **Vorne** | Startseite |
| **Zeug** | alle Projekte |
| **Ich** | Über mich |
| **Post** | Kontakt |

## Startseite

1. **Cover klappt auf** → „Leo Pfyl“ **zeichnet sich selbst** Strich für Strich
2. **„Frisch aus dem Heft“** – eine **Wäscheleine** mit den 5–6 besten Arbeiten, die schaukelt (Maus, Scroll, anstupsen). Klick öffnet das Projekt.
3. **Zeigende Figur** zeigt auf „Mehr Zeug →“
4. **Daumenkino** – eine von Leos Procreate-Animationen läuft beim Scrollen Bild für Bild ab (vorwärts und rückwärts)
5. **„Das bin ich (in echt)“** – echtes Foto, mit Klebeband eingeklebt, ein paar Sätze, daneben die **Hallo-Figur**, die beim Hover winkt
6. **„Schreib mir was rein“** – Kontaktformular auf liniertem Papier, geht direkt an Leos Mail
7. **Footer** – die **zeichnende Figur** sitzt da und zeichnet, Instagram + LinkedIn (eigenes Social-Zeichen)

## Projekte-Seite („Zeug“)

- Alle ca. 15 Projekte, **in Reihen, aber leicht schief eingeklebt** (Klebestreifen)
- Unter jedem Projekt eine **handschriftliche Notiz** als Titel
- **Filter** als handgezeichnete Tabs: Alles · Animation · Plakate · Illustration · Web (Figma)
- Hover: Karte richtet sich gerade, hebt sich leicht an; bei Animationen startet die Vorschau

## Projekt-Detailseite

- Titel, Jahr, Kategorie, Beschreibung, Tools, Auftraggeber (falls vorhanden)
- Grosse Bilder / Videos
- **Skizzen aus dem Entstehungsprozess**
- Weiter zum nächsten Projekt (mit Übergang)

## Bewegung im Skizzenbuch

- Bilder werden beim Scrollen **hingeklebt** (fallen leicht schräg aufs Papier, Klebestreifen klatscht drauf)
- **Kritzeleien am Rand** zeichnen sich beim Scrollen selbst: rote Pfeile, Kreise, Unterstreichungen, Sternchen
- Papierschnipsel bewegen sich unterschiedlich schnell (Tiefe)
- Buttons: gezeichnete, leicht schiefe Umrandung, beim Hover **schraffiert ausgemalt**
- Links: Unterstreichung **zeichnet sich live** beim Hover
- **3 Daumenkinos** aus bestehenden Procreate-Animationen (Platzierung je nach Inhalt)
- Normaler Mauszeiger (kein Bleistift)

## Fehlerseite (404)

Die zeichnende Figur: „Diese Seite gibt’s noch nicht – ich zeichne sie gerade.“

## CMS (kommt, wenn die Seite steht)

- `leopfyl.ch/admin`, geschützt mit Login
- Projekte hinzufügen, bearbeiten, löschen, Reihenfolge ändern
- Felder: Titel, Notiz, Kategorie, Jahr, Beschreibung, Tools, Auftraggeber, Titelbild, Bilder/Videos, Prozess-Skizzen, „auf der Wäscheleine zeigen“ ja/nein
- Bis das CMS steht, liegen die Projekte in einer eigenen Datendatei – das CMS übernimmt später genau diese Daten

## Technik

| Teil | Technik |
|---|---|
| Seite | HTML, CSS, JavaScript |
| Animationen | GSAP (inkl. ScrollTrigger) |
| CMS + Kontaktformular | PHP + MySQL (läuft auf Hostpoint) |
| Versionierung | Git, Commit & Push mit **GitHub Desktop** |
| Hochladen | GitHub Action lädt bei jedem Push automatisch per SFTP auf Hostpoint |
| Sicherheit | Zugangsdaten nur als GitHub Secrets bzw. in Config-Dateien ausserhalb des Repos, Passwort nur als Hash, Spamschutz im Formular |

## Vorerst nicht

- Geräusche (im Hinterkopf behalten: Papierrascheln, Stiftkratzen – mit Aus-Knopf)
- Englische Version
