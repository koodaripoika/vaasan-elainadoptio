# Vaasan eläinadoptio

Web-palvelujen toteutus -kurssin harjoitustyö. Teen Vaasan Eläinsuoja ry:lle sivun, jossa voi selata adoptoitavia eläimiä ja jättää adoptiohakemuksen suoraan netissä. Nyt hakemus pitää jättää soittamalla tai käymällä paikan päällä.

## Suunnitelma

- Server A hoitaa eläinten tiedot (GET /animals, GET /animals/:id) ja ottaa vastaan adoptiohakemukset (POST /animals/:id/adopt)
- Server B tallentaa hakemukset (POST /adoptions)
- Tietokantana PostgreSQL
- Frontend tavallisella HTML:llä, CSS:llä ja JavaScriptillä
- Kaikki pyörii Dockerissa

Asennusohjeet lisään tähän kun projekti on pidemmällä.
