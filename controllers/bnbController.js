import connection from "../data/data.js";

const index = (req, res) => {
  const sql = "SELECT * FROM immobili";

  connection.query(sql, (err, results) => {
    if (err) res.status(500).json({ error: "query al database fallita" });
    res.json(results);
  });
};

const show = (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM immobili WHERE id = ?";

  connection.query(sql, [id], (err, results) => {
    if (err) res.status(500).json({ error: "query al database fallita" });
    if (results.length == 0 || results[id] === null)
      res.status(404).json({ error: "Immobile non trovato" });

    res.json(results[0]);
  });
};

const store = (req, res) => {
  const {
    descrizione_immobile,
    stanze,
    bagni,
    letti,
    metri_quadrati,
    indirizzo,
    immagine,
    tipologia,
    voti,
    proprietario_id,
  } = req.body;

  const sql =
    "INSERT INTO immobili (descrizione_immobile, stanze, bagni, letti, metri_quadrati, indirizzo, immagine, tipologia, voti, proprietario_id) VALUES (?,?,?,?,?,?,?,?,?,?)";

  connection.query(
    sql,
    [
      descrizione_immobile,
      stanze,
      bagni,
      letti,
      metri_quadrati,
      indirizzo,
      immagine,
      tipologia,
      voti,
      proprietario_id,
    ],
    (err, results) => {
      if (err) res.status(500).json({ error: "Errore query al database" });
      res.status(201).json({
        status: "success",
        message: "Immobile aggiunto con successo",
      });
    }
  );
};

export default {
  index,
  show,
  store,
};
