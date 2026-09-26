# Gessica & Luca – Hochzeit

Hochzeitswebsite für **10. Juli 2027**.

Geplante Adresse: **https://ilnostrogiorno.congiu.ch**  
Cloudflare-Pages-Vorschau: **https://gessi-luca-hochzeit.pages.dev**

## Inhalt

- Sprachwahl Deutsch / Italiano beim Einstieg
- Countdown bis zur Hochzeit
- Tagesablauf
- Locations: Klosterkirche Muri und Theater Casino Zug
- Menübereich
- RSVP mit allen teilnehmenden Personen sowie Allergien / Unverträglichkeiten
- Foto-Upload für Gäste
- FAQ
- Responsive, mobile-first und ohne Frontend-Framework

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

Die Location-Fotos werden direkt von Wikimedia Commons geladen:

- Klosterkirche Muri: Wici, Wikimedia Commons – CC BY-SA 3.0 / GFDL
- Theater Casino Zug: Elena Ternovaja, Wikimedia Commons – CC BY-SA 3.0

Die jeweiligen Commons-Dateiseiten sind im Footer der Website verlinkt.
