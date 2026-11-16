# Vaasan eläinadoptio

Web-palvelujen toteutus -kurssin harjoitustyö. Tein Vaasan Eläinsuoja ry:lle sivun, jossa voi selata adoptoitavia eläimiä ja jättää adoptiohakemuksen suoraan netissä. Ennen tätä hakemus piti jättää soittamalla tai käymällä paikan päällä.

Sivulla voi:

- katsoa kaikki adoptoitavat eläimet korttinäkymässä
- avata eläimen oman sivun, jossa on kaikki tiedot
- täyttää adoptiolomakkeen ja saada heti vahvistuksen kiitos-sivulla

Samaa eläintä ei voi adoptoida kahdesti. Kun eläin on adoptoitu, se näkyy listassa harmaana ja sen sivulla ei enää ole lomaketta.

## Kansiot

```
vaasan-elainadoptio/
├── db/
│   └── init.sql          tietokannan taulut ja esimerkkidata
├── server-a/             pääpalvelin (eläimet), portti 3001
├── server-b/             adoptiopalvelin, portti 3002
├── frontend/             nettisivu (HTML, CSS, JS), portti 8080
└── docker-compose.yml    käynnistää kaiken kerralla
```

Jokainen palvelu on omassa kontissaan, eli kontteja on neljä: db, server-a, server-b ja frontend.

## Asennus ja käynnistys

Tarvitset koneelle Dockerin. Windowsilla ja Macilla helpoin on Docker Desktop, Linuxilla Docker ja Docker Compose. Docker Desktopin pitää olla päällä ennen kuin ajat komennot.

1. Kloonaa repo ja mene kansioon:

```
git clone https://github.com/koodaripoika/vaasan-elainadoptio.git
cd vaasan-elainadoptio
```

Jos sinulla ei ole gitiä, voit myös ladata repon zip-tiedostona GitHubista (Code -> Download ZIP) ja purkaa sen.

2. Käynnistä kaikki palvelut:

```
docker-compose up --build
```

Uudemmissa Docker-versioissa toimii myös `docker compose up --build` (ilman väliviivaa). Ensimmäisellä kerralla tässä menee hetki, koska Docker lataa imaget ja asentaa npm-paketit.

3. Avaa selaimessa http://localhost:8080

Tietokanta alustuu itsestään ensimmäisellä käynnistyskerralla, eli mitään ei tarvitse tehdä käsin. Postgres ajaa `db/init.sql`-tiedoston, joka luo taulut ja lisää 12 esimerkkieläintä.

### Pysäytys ja tietokannan nollaus

Palvelut saa pois päältä painamalla terminaalissa Ctrl + C, tai toisessa terminaalissa:

```
docker-compose down
```

Data säilyy volumessa, eli adoptiot ja tykkäykset on tallessa seuraavallakin kerralla. Jos haluat aloittaa puhtaalta pöydältä (kaikki eläimet taas vapaana), käytä `-v`:tä. Se poistaa myös volumen, ja init.sql ajetaan uudestaan seuraavalla käynnistyksellä:

```
docker-compose down -v
```

Jos jokin porteista (8080, 3001, 3002) on jo käytössä koneellasi, ne voi vaihtaa `docker-compose.yml`:stä.

## Miten tämä toimii

Palvelimia on kaksi, ja ne on tehty Node.js:llä ja Expressillä. Molemmat käyttää samaa PostgreSQL-tietokantaa.

Server A on pääpalvelin. Frontend puhuu vain sen kanssa. Server A hakee eläinten tiedot kannasta ja ottaa vastaan adoptiohakemukset, mutta ei tallenna niitä itse vaan välittää ne Server B:lle.

Server B on adoptiopalvelin. Se tallentaa hakemukset ja merkitsee eläimen adoptoiduksi. Selain ei kutsu sitä koskaan suoraan.

### Eläinten haku

```
Selain  --GET /animals-->  Server A  --SELECT-->  tietokanta
Selain  <-----JSON-------  Server A  <---rivit--  tietokanta
```

### Adoptiohakemuksen kulku

1. Käyttäjä täyttää lomakkeen ja painaa "Adoptoi minut". Frontend lähettää tiedot Server A:lle: `POST /animals/:id/adopt`
2. Server A tarkistaa, että eläin on olemassa ja vielä vapaana. Sitten se lähettää hakemuksen eteenpäin Server B:lle: `POST /adoptions`. Docker-verkossa Server A löytää B:n osoitteella `http://server-b:3002`, eli palvelun nimi toimii osoitteena.
3. Server B tallentaa hakemuksen `adoptions`-tauluun ja vaihtaa eläimen statukseksi `adopted`. Nämä tehdään samassa transaktiossa, eli joko molemmat onnistuu tai ei kumpikaan.
4. Server B vastaa Server A:lle (201 Created).
5. Server A palauttaa vastauksen frontendille, ja frontend siirtyy kiitos-sivulle.

Kiitos-sivu näytetään vasta kun hakemus on oikeasti tallennettu kantaan.

### Miten tupla-adoptio estetään

Tähän on kolme tarkistusta:

- Server A katsoo ensin eläimen statuksen ja vastaa 409, jos eläin on jo adoptoitu.
- Server B tekee päivityksen muodossa `UPDATE animals SET status = 'adopted' WHERE id = ... AND status = 'available'`. Jos eläin on jo adoptoitu, päivitys ei osu mihinkään riviin ja B palauttaa 409. Tämä toimii myös silloin, kun kaksi ihmistä lähettää hakemuksen samaan aikaan.
- Tietokannassa `adoptions.animal_id` on UNIQUE, eli samalle eläimelle ei voi tallentaa kahta hakemusta.

## Tietokanta

Tauluja on kaksi.

`animals` sisältää eläimet:

| Sarake | Tyyppi | Selitys |
|---|---|---|
| id | SERIAL | pääavain, kasvaa itsestään |
| name | VARCHAR | eläimen nimi |
| type | VARCHAR | laji (kissa, koira, kani, lintu) |
| age | INTEGER | ikä vuosina |
| breed | VARCHAR | rotu |
| description | TEXT | kuvaus |
| image_url | TEXT | kuvan osoite, saa olla tyhjä |
| likes | INTEGER | tykkäysten määrä |
| status | VARCHAR | `available` tai `adopted` |

`adoptions` sisältää adoptiohakemukset:

| Sarake | Tyyppi | Selitys |
|---|---|---|
| id | SERIAL | pääavain |
| animal_id | INTEGER | viiteavain animals-tauluun (UNIQUE) |
| applicant_name | VARCHAR | hakijan nimi |
| email | VARCHAR | hakijan sähköposti |
| phone | VARCHAR | puhelinnumero, ei pakollinen |
| message | TEXT | vapaa viesti |
| created_at | TIMESTAMP | milloin hakemus tuli |

Taulujen välinen yhteys on `adoptions.animal_id -> animals.id`. Yhdellä eläimellä voi olla enintään yksi hakemus.

Kantaa voi katsoa itse, kun kontit on päällä:

```
docker-compose exec db psql -U elainsuoja -d elainadoptio
```

Sen jälkeen esim. `SELECT * FROM animals;` tai `SELECT * FROM adoptions;`. Ulos pääsee komennolla `\q`.

## API

### Server A (http://localhost:3001)

| Metodi | Osoite | Mitä tekee |
|---|---|---|
| GET | /animals | palauttaa kaikki eläimet |
| GET | /animals/:id | palauttaa yhden eläimen |
| POST | /animals/:id/adopt | ottaa vastaan adoptiohakemuksen ja välittää sen Server B:lle |
| POST | /animals/:id/like | lisää eläimelle tykkäyksen (lisäominaisuus) |

### Server B (http://localhost:3002)

| Metodi | Osoite | Mitä tekee |
|---|---|---|
| POST | /adoptions | tallentaa hakemuksen ja päivittää eläimen statuksen |
| GET | /adoptions | listaa kaikki hakemukset (lisäominaisuus, kätevä testatessa) |

Adoptiohakemuksen body on JSON:

```json
{
  "applicant_name": "Maija Meikäläinen",
  "email": "maija@example.com",
  "phone": "0401234567",
  "message": "Meillä on iso piha"
}
```

Nimi ja sähköposti on pakollisia, muut ei.

Statuskoodit, joita palvelimet palauttaa:

- 200 = ok
- 201 = hakemus tallennettu
- 400 = jotain puuttuu tai id ei ole numero
- 404 = eläintä ei löydy
- 409 = eläin on jo adoptoitu
- 502 = Server A ei saa yhteyttä Server B:hen

GET-pyyntöjä voi testata ihan selaimella, esim. http://localhost:3001/animals tai http://localhost:3002/adoptions. POSTia on helpointa kokeilla Postmanilla. Curlilla se menee näin (toimii ainakin Git Bashissa, Macilla ja Linuxilla, PowerShellissä lainausmerkkien kanssa oli ongelmia):

```
curl -X POST http://localhost:3001/animals/1/adopt -H "Content-Type: application/json" -d '{"applicant_name":"Testi","email":"testi@example.com"}'
```

## Lisäominaisuudet

Näitä ei vaadittu, mutta tein ne lisäksi:

- eläinten suodatus lajin mukaan etusivulla (kaikki, koirat, kissat, muut)
- tykkää-nappi eläimen sivulla, tykkäykset tallentuu kantaan
- adoptoidut eläimet näkyy listassa harmaana "Adoptoitu"-merkillä, ja niiden sivulla ei näytetä lomaketta
- jos kuvan linkki on rikki tai kuvaa ei ole, tilalla näkyy placeholder-kuva
- GET /adoptions Server B:ssä, niin hakemukset näkee helposti demossa
- sivu toimii myös puhelimella

## Ilman Dockeria

Tätä ei tarvitse jos Docker on käytössä, mutta laitan varmuuden vuoksi:

1. Asenna PostgreSQL ja luo käyttäjä `elainsuoja` (salasana `salasana`) ja tietokanta `elainadoptio`.
2. Aja `db/init.sql` siihen kantaan.
3. Mene kansioon `server-b` ja aja `npm install` ja `npm start`.
4. Mene kansioon `server-a` ja aja `npm install` ja `npm start`.
5. Avaa `frontend`-kansio jollain staattisella palvelimella portissa 8080, esim. VS Coden Live Serverillä tai `npx serve -l 8080 frontend`.

Palvelimissa on oletuksena localhost-osoitteet, joten ne löytää toisensa ilman lisäsäätöjä.

## Käytetyt tekniikat

- Node.js 22 ja Express 5 (palvelimet)
- pg-kirjasto PostgreSQL-yhteyteen
- cors, koska frontend on eri portissa kuin Server A
- PostgreSQL 16
- nginx frontendin jakamiseen
- Docker ja Docker Compose

Eläinten kuvat on Unsplashista.
