// Server B - adoptiopalvelin
// Ottaa vastaan adoptiohakemukset Server A:lta, tallentaa ne kantaan
// ja merkitsee eläimen adoptoiduksi

const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3002;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "elainsuoja",
  password: process.env.DB_PASSWORD || "salasana",
  database: process.env.DB_NAME || "elainadoptio",
});

// tähän ei tarvita cors:ia, koska selain ei kutsu tätä palvelinta suoraan,
// vaan pyynnöt tulee aina Server A:n kautta
app.use(express.json());

// POST /adoptions - tallentaa uuden adoptiohakemuksen
app.post("/adoptions", async (req, res) => {
  // jos pyynnössä ei ole bodya ollenkaan niin req.body on undefined,
  // ja silloin destrukturointi kaatuisi. Tässä meni hetki tajuta miksi
  const body = req.body || {};
  const { animal_id, applicant_name, email, phone, message } = body;

  if (!animal_id || !applicant_name || !email) {
    return res.status(400).json({ error: "animal_id, nimi ja sähköposti ovat pakollisia" });
  }

  // transaktiota varten pitää ottaa oma yhteys poolista, koska BEGIN ja COMMIT
  // pitää ajaa samalla yhteydellä
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Merkitään eläin adoptoiduksi. Ehto status = 'available' hoitaa sen, että
    // samaa eläintä ei voi adoptoida uudestaan: jos eläin on jo adoptoitu,
    // päivitys ei osu yhteenkään riviin
    const updateResult = await client.query(
      "UPDATE animals SET status = 'adopted' WHERE id = $1 AND status = 'available' RETURNING name",
      [animal_id]
    );

    if (updateResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Eläin on jo adoptoitu tai sitä ei ole olemassa" });
    }

    const insertResult = await client.query(
      "INSERT INTO adoptions (animal_id, applicant_name, email, phone, message) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [animal_id, applicant_name, email, phone, message]
    );

    // vasta tässä muutokset menee oikeasti kantaan. Jos jokin yllä olevista
    // kaatuu, catch tekee ROLLBACKin eikä eläimen status jää muuttuneeksi
    await client.query("COMMIT");

    res.status(201).json({
      message: "Adoptiohakemus vastaanotettu",
      animal_name: updateResult.rows[0].name,
      adoption: insertResult.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Virhe hakemuksen tallennuksessa:", err.message);
    res.status(500).json({ error: "Hakemuksen tallennus epäonnistui" });
  } finally {
    // yhteys pitää muistaa palauttaa pooliin, muuten ne loppuu jossain vaiheessa
    client.release();
  }
});

// GET /adoptions - kaikki hakemukset. Tätä ei tehtävässä vaadittu,
// mutta tällä on helppo tarkistaa demossa että hakemukset tallentuu
app.get("/adoptions", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT adoptions.*, animals.name AS animal_name FROM adoptions JOIN animals ON animals.id = adoptions.animal_id ORDER BY adoptions.created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Virhe hakemusten haussa:", err.message);
    res.status(500).json({ error: "Hakemusten haku epäonnistui" });
  }
});

app.listen(PORT, () => {
  console.log("Server B käynnissä portissa " + PORT);
});
