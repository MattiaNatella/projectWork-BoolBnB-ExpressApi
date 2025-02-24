import connection from "../data/data.js";

const validateProperty = (data) => {
    const errors = [];
    const {
        descrizione_immobile,
        stanze,
        bagni,
        letti,
        metri_quadrati,
        indirizzo,
        immagine,
        tipologia_id,
        proprietario_id,
    } = data;


    //autenticazione dei dati
    if (!descrizione_immobile || descrizione_immobile.trim() === "")
        errors.push("Descrizione immobile obbligatoria");
    if (!indirizzo || indirizzo.trim() === "")
        errors.push("Indirizzo obbligatorio");
    if (stanze <= 0 || isNaN(stanze)) errors.push("Numero di stanze non valido");
    if (bagni <= 0 || isNaN(bagni)) errors.push("Numero di bagni non valido");
    if (letti <= 0 || isNaN(letti)) errors.push("Numero di letti non valido");
    if (metri_quadrati <= 0 || isNaN(metri_quadrati))
        errors.push("Superficie non valida");
    if (immagine && !/^\w+\.(jpg|jpeg|png|webp|gif)$/i.test(immagine))
        errors.push("URL immagine non valido");
    if (!proprietario_id || isNaN(proprietario_id))
        errors.push("ID proprietario non valido");

    return errors;
};

const index = (req, res) => {
    const sql = "SELECT * FROM immobili";

    connection.query(sql, (err, results) => {
        if (err) res.status(500).json({ error: "query al database fallita"});
        res.json(results);
    });
};

const filterIndex = (req,res) => {
    let {tipologia_id, indirizzo, voto_min, stanze_min, bagni_min, letti_min} = req.query;
    let sql = "SELECT * FROM immobili WHERE 1=1";
    let params = [];
    console.log("Valore di indirizzo ricevuto:", indirizzo);


    if(tipologia_id) {
        sql += " AND tipologia_id = ? " ;
        params.push(tipologia_id);
    }
    if (indirizzo) {
        sql += " AND SUBSTRING_INDEX(indirizzo, ', ', -1) LIKE ? ";
        params.push(`%${indirizzo}`);
    }
    
    if(voto_min) {
        sql += " AND voto >=? "
        params.push(voto_min);
    }
    if (stanze_min) {
        sql += " AND stanze >= ? ";
        params.push(stanze_min);
    }
    if (bagni_min) {
        sql += " AND bagni >= ? ";
        params.push(bagni_min);
    }
    if (letti_min) {
        sql += " AND letti >= ? ";
        params.push(letti_min);
    }

    sql += " ORDER BY voto DESC";

    console.log("SQL generato:", sql);
    console.log("Parametri:", params);

    connection.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err});
        if (results.length == 0) return res.status(404).json({message: 'Non ci sono immobili disponibili'})
        res.json(results);
    });
};


const show = (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM immobili WHERE id = ?";

    connection.query(sql, [id], (err, results) => {
        if (err) res.status(500).json({ error: err });
        if (results.length == 0 || results[id] === null)
            res.status(404).json({ error: "Immobile non trovato" });

        res.json(results[0]);
    });
};

const store = (req, res) => {
    const errors = validateProperty(req.body);
    if (errors.length > 0) return res.status(400).json({ error: errors });

    const {
        descrizione_immobile,
        stanze,
        bagni,
        letti,
        metri_quadrati,
        indirizzo,
        immagine,
        tipologia,
        voto,
        proprietario_id,
    } = req.body;

    const sql =
        "INSERT INTO immobili (descrizione_immobile, stanze, bagni, letti, metri_quadrati, indirizzo, immagine, tipologia, voto, proprietario_id) VALUES (?,?,?,?,?,?,?,?,?,?)";

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
            voto,
            proprietario_id,
        ],
        (err, results) => {
            if (err) res.status(500).json({ error: err });
            res.status(201).json({
                status: "success",
                message: "Immobile aggiunto con succcesso",
            });
        }
    );
};


const storeReview = (req, res) => {
    const id = req.params.id;
    const { username, testo, gg_permanenza } = req.body;

    //autenticazione dei dati
    if (!username || username.trim() === "")
        return res.status(400).json({ error: "Username obbligatorio" });
    if (!testo || testo.trim() === "")
        return res
            .status(400)
            .json({ error: "Testo della recensione obbligatorio" });
    if (gg_permanenza <= 0 || isNaN(gg_permanenza))
        return res
            .status(400)
            .json({ error: "Numero giorni permanenza non valido" });

    const sql =
        "INSERT INTO recensioni (immobile_id, username, testo, gg_permanenza) VALUES (?,?,?,?);";

    connection.query(
        sql,
        [id, username, testo, gg_permanenza],
        (err, results) => {
            if (err) res.status(500).json({ error: err });
            res.status(201).json({
                status: "Success",
                message: "Recensione inserita correttamente",
                id: results.insertId,
            });
            console.log(results);
        }
    );
};

const modifyVote = (req, res) => {
    const id = req.params.id;

    const sql = "UPDATE immobili SET voto = voto + 1 WHERE id = ?;";

    connection.query(sql, [id], (err, results) => {
        if (err) res.status(500).json({ error: err });
        res.status(200).json({
            status: "Success",
            message: "Cuoricino aggiunto!",
            affectedRows: results.affectedRows,
        });
        console.log(results);
    });
};

export default {
    index,
    filterIndex,
    show,
    store,
    storeReview,
    modifyVote,
    
};
