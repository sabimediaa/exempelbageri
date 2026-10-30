# Exempelbageri – projektkontext

Det här projektet började i en konversation i Claude-appen och fortsätter här i Claude Code. Allt nedan är beslut som redan är tagna.

## Vad det är

En hemsida för ett **exempelbageri** (inget riktigt företagsnamn, skriv bara "Exempelbageri"). Bageriet säljer:
kakor, hembakat, matbröd, fikabröd och granola.

## Beslut

- **Färg:** olivgrön. Färgerna är CSS-variabler överst i `css/style.css`, med ljust och mörkt läge.
- **Typsnitt:** Young Serif (rubriker) och Figtree (brödtext) från Google Fonts.
- **Ingen butik.** Allt säljs via **Swish & Grab-skåpet** vid vägen och via beställningar. Inga öppettider för butik.
- **Swish & Grab-skåp:** egen sida med skåpets plats (adress, kartskiss, länk till Google Maps), vad som finns i skåpet och hur många, status (Finns / Få kvar / Slut), hur man handlar, en räknare där man trycker + på det man tar och ser summan att swisha, och Swishnummer att kopiera.
- **Meny:** knappen "Meny" delar upp skärmen i rutor (Swish & Grab, Kakor, Hembakat, Matbröd, Fikabröd, Granola, Allt, Beställ, Om oss). Varje ruta öppnar en egen sida via hash-länkar (`#kakor`, `#skapet` osv.).
- **Förebild:** strukturen följer användarens tidigare projekt "Kakbageriet Demo": hero med siffror, rullande remsa med sortnamn, veckans favoriter, "Så funkar det" i tre steg, informationsruta per vara med ingredienser och allergener, beställningsformulär (i stället för catering), Om oss med värderingar och vanliga frågor, sidfot med kontakt och Instagram, och en admin med sidomeny.
- **Admin:** Översikt (siffror och lista över vad som ska bakas och fyllas på), Skåpet (lager med +/−, öppet/stängt, nästa påfyllning), Sortiment (ändra, lägg till, ta bort, ingredienser, allergener, etikett, i skåpet ja/nej), Info & kontakt. Admin och sparande fungerar bara när sidan körs som artifact i Claude (via `window.claude`). Som vanlig webbsida visas admin inte.
- **Beställningsformuläret** skickar inget. Det skapar en färdig text som kunden kopierar och skickar till bageriets e-post.
- Adress, Swishnummer, telefon och e-post är påhittade exempeluppgifter.

## Filer

- `index.html` – skal som laddar CSS och JS
- `css/style.css` – design
- `js/data.js` – all data (`window.SITE_DATA`): skåpet, kontakt, om oss-text och produkter
- `js/app.js` – rendering, routing, meny, räknare, formulär och admin

## Nästa steg som användaren bett om

1. Skapa ett nytt **publikt** GitHub-repo (förslag: `exempelbageri`), pusha koden och **slå på GitHub Pages** från `main`, rotmappen. `.nojekyll` finns redan.
2. Om admin ska fungera på GitHub Pages behövs en annan lösning för att spara data (t.ex. en backend eller ett headless CMS), eftersom `window.claude` inte finns där. Fråga användaren innan något sådant byggs.

## Användaren

Skriver på svenska. Svara på svenska.
