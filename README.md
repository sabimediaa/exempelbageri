# Exempelbageri

Olivgrön hemsida för ett hembageri utan butik: delad meny, sortiment med ingredienser och allergener, Swish & Grab-skåp med räknare och ett beställningsformulär.

## Filer

- `index.html` – sidans skal
- `css/style.css` – all design (färger som variabler överst, mörkt läge ingår)
- `js/data.js` – sortiment, lager, skåpets adress, Swishnummer och kontaktuppgifter
- `js/app.js` – sidor, meny och logik

## Köra lokalt

Öppna `index.html` direkt i webbläsaren, eller kör en enkel server:

```
python3 -m http.server 8000
```

och gå till http://localhost:8000.

## Uppdatera lagret

Ändra `left` (antal kvar) och `inCab` (ligger i skåpet) per produkt i `js/data.js`.

Adminsidan i koden fungerar bara när sidan är publicerad som artifact i Claude. Som vanlig webbsida visas den inte.
