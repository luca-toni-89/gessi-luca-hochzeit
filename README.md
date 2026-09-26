# Gessica & Luca – Hochzeit

Hochzeitswebsite für **10. Juli 2027**.

Geplante Adresse: **https://ilnostrogiorno.congiu.ch**  
Cloudflare-Pages-Vorschau: **https://gessi-luca-hochzeit.pages.dev**

## Inhalt

- Filmische Editorial-Identität „Il nostro giorno“ in Aubergine, Papierweiss und Gold
- Sprachwahl Deutsch / Italiano ohne vorgeschaltete Zugangssperre
- Countdown bis zur Hochzeit
- Animierter Tagesablauf mit zeichnender Linie
- Ausführliche, zweisprachige Kapitel zur Klosterkirche Muri und zum Theater Casino Zug
- Menübereich
- RSVP mit allen teilnehmenden Personen sowie Allergien / Unverträglichkeiten
- Foto-Upload für Gäste
- FAQ
- Responsive, barrierearm und ohne Frontend-Framework

Das Paarbild ist als klar gekennzeichneter typografischer Platzhalter angelegt, bis das Originalfoto beziehungsweise die freigegebene Paarillustration vorliegt. Es wird keine fremde oder erfundene Person verwendet.

## Cloudflare

Die Seite ist für **Cloudflare Pages** ausgelegt.

- Produktionsbranch: `main`
- Build command: keiner
- Build output directory: `public`
- Pages Functions: `functions/`
- D1 Binding für RSVP/Metadaten: `DB`
- R2 Binding für Gästefotos: `PHOTOS`

Nach dem Erstellen der D1-Datenbank die Migration aus `migrations/0001_initial.sql` ausführen.

### Datenschutz

Gästedaten und Fotos werden **nicht** im öffentlichen GitHub-Repository gespeichert. RSVP-Daten gehen ausschliesslich an D1, Fotos ausschliesslich an R2. Es gibt bewusst keinen öffentlichen API-Endpunkt zum Auslesen der Gästeliste oder Fotos.

## Domain / Mail

`congiu.ch` und die bestehenden Mail-DNS-Einträge bleiben bei Hostpoint. **Nameserver nicht ändern.** Die Hochzeits-Subdomain wird separat mit Cloudflare Pages verbunden; die bestehende Mail-Infrastruktur darf dabei nicht verändert werden.

## Bildnachweise

Die Location-Fotos stammen von Wikimedia Commons und werden als optimierte WebP-Dateien lokal ausgeliefert:

- Klosterkirche Muri: Wici, Wikimedia Commons – CC BY-SA 3.0 / GFDL
- Theater Casino Zug: Elena Ternovaja, Wikimedia Commons – CC BY-SA 3.0

Die jeweiligen Commons-Dateiseiten sind im Footer der Website verlinkt.
