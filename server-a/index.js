// Server A - pääpalvelin
// Hoitaa eläinten tiedot ja toimii "porttina" frontendin ja Server B:n välissä

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

// Server B:n osoite. Docker-verkossa palvelun nimi (server-b) toimii osoitteena
const SERVER_B_URL = process.env.SERVER_B_URL || "http://localhost:3002";

// Tietokantayhteys. Dockerissa arvot tulee docker-compose.yml:stä,
// oletusarvot on vaan sitä varten että tätä voi ajaa myös omalla koneella
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "elainsuoja",
  password: process.env.DB_PASSWORD || "salasana",
  database: process.env.DB_NAME || "elainadoptio",
});

// cors tarvitaan koska frontend on eri portissa (8080) kuin tämä palvelin,
// muuten selain estää kutsut
app.use(cors());
app.use(express.json());

// GET /animals - palauttaa kaikki eläimet
app.get("/animals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM animals ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Virhe eläinten haussa:", err.message);
    res.status(500).json({ error: "Eläinten haku epäonnistui" });
  }
});

// GET /animals/:id - palauttaa yhden eläimen
app.get("/animals/:id", async (req, res) => {
  const id = Number(req.params.id);

  // jos id ei ole numero (esim /animals/abc) niin postgres heittää virheen,
  // joten tarkistetaan se ensin itse
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Virheellinen id" });
  }

  try {
    const result = await pool.query("SELECT * FROM animals WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Eläintä ei löytynyt" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Virhe eläimen haussa:", err.message);
    res.status(500).json({ error: "Eläimen haku epäonnistui" });
  }
});

// POST /animals/:id/adopt - ottaa vastaan adoptiohakemuksen frontendiltä
// ja välittää sen Server B:lle, joka hoitaa varsinaisen tallennuksen
app.post("/animals/:id/adopt", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const { applicant_name, email, phone, message } = body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Virheellinen id" });
  }

  if (!applicant_name || !email) {
    return res.status(400).json({ error: "Nimi ja sähköposti ovat pakollisia" });
  }

  try {
    // tarkistetaan ensin että eläin on olemassa ja vielä vapaana,
    // niin turhia pyyntöjä ei tarvitse lähettää Server B:lle asti
    const result = await pool.query("SELECT * FROM animals WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Eläintä ei löytynyt" });
    }

    if (result.rows[0].status === "adopted") {
      return res.status(409).json({ error: "Tämä eläin on jo adoptoitu" });
    }

    // lähetetään hakemus Server B:lle. Nodessa on fetch valmiina (versiosta 18 asti),
    // joten mitään axiosta tms ei tarvinnut asentaa
    const response = await fetch(SERVER_B_URL + "/adoptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        animal_id: id,
        applicant_name: applicant_name,
        email: email,
        phone: phone,
        message: message,
      }),
    });

    const data = await response.json();

    // palautetaan Server B:n vastaus frontendille samalla statuskoodilla,
    // eli onnistuessa 201 ja jos eläin ehdittiin adoptoida välissä niin 409
    res.status(response.status).json(data);
  } catch (err) {
    // tänne tullaan esim. jos Server B ei ole päällä
    console.error("Virhe adoptiohakemuksen välityksessä:", err.message);
    res.status(502).json({ error: "Adoptiopalvelimeen ei saatu yhteyttä" });
  }
});

app.listen(PORT, () => {
  console.log("Server A käynnissä portissa " + PORT);
});
