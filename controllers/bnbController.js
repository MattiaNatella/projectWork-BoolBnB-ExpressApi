import connection from "../data/data.js";
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { error } from "console";


// Ottieni il percorso del file corrente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// funzione per validazione dei dati
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
        tipologia,
        proprietario
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
    if (!tipologia)
        errors.push("tipologia non valida");

    if (!proprietario) {
        errors.push("Dati proprietario mancancanti");
    } else {
        const { nome, cognome, email } = proprietario;

        if (!nome || nome.trim() === "") errors.push("Nome del proprietario obbligatorio");
        if (!cognome || cognome.trim() === "") errors.push("Cognome del proprietario obbligatorio");
        if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) errors.push("Email del proprietario non valida");
    }

    return errors;
};


const validateSearchParams = (query) => {
    const errors = [];
    if (query.tipologia && isNaN(query.tipologia))
        errors.push("Tipologia non valida")
    if (query.stanze && (isNaN(query.stanze) || query.stanze < 0))
        errors.push("Numero minimo di stanze non valido")
    if (query.bagni && (isNaN(query.bagni) || query.bagni < 0))
        errors.push("Numero minimo di bagno non valido")

    return errors

}

// --INDEX--
const index = (req, res) => {
    const sql = "SELECT immobili.*, COUNT(recensioni.id) AS num_recensioni FROM immobili LEFT JOIN recensioni ON immobili.id = recensioni.immobile_id GROUP BY immobili.id ORDER BY voto DESC;";

    connection.query(sql, (err, results) => {
        if (err) res.status(500).json({ error: "query al database fallita" });
        console.log(req.imageName)
        const immobili = results.map(immobile => {
            return {
                ...immobile,
                immagine: req.imagePath + immobile.immagine
            }
        })
        res.json(immobili);
    });
};

// --TIPOLOGIE INDEX--
const tipologieIndex = (req, res) => {
    const sql = "SELECT * FROM tipologie";

    connection.query(sql, (err, results) => {
        if (err) res.status(500).json({ error: err })
        return res.json(results)
    })
}

//-- INDEX FILTRATO--

const filterIndex = (req, res) => {
    let { tipologia, indirizzo, stanze, bagni } = req.query;

    const errors = validateSearchParams(req.query);
    if (errors.length > 0) return res.status(400).json({ error: errors });

    let sql = "SELECT immobili.*, COUNT(recensioni.id) AS num_recensioni FROM immobili LEFT JOIN recensioni ON immobili.id = recensioni.immobile_id WHERE 1=1";

    let params = [];
    console.log("Valore di indirizzo ricevuto:", indirizzo);


    if (tipologia) {
        sql += " AND tipologia_id = ? ";
        params.push(tipologia);
    }
    if (indirizzo) {
        sql += `
            AND (
                indirizzo = ? 
                OR SUBSTRING_INDEX(indirizzo, ', ', -1) = ? 
                OR SUBSTRING_INDEX(indirizzo, ', ', 1) LIKE ? 
            )`;
        params.push(indirizzo, indirizzo, `${indirizzo}%`);
    }
    if (stanze) {
        sql += " AND stanze >= ? ";
        params.push(stanze);
    }
    if (bagni) {
        sql += " AND bagni >= ? ";
        params.push(bagni);
    }


    sql += " GROUP BY immobili.id ORDER BY voto DESC";

    console.log("SQL generato:", sql);
    console.log("Parametri:", params);

    connection.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length == 0) return res.status(404).json({ message: 'Non ci sono immobili disponibili' })
        const filteredImmobili = results.map(immobile => {
            return {
                ...immobile,
                immagine: req.imagePath + immobile.immagine
            }
        })
        res.json(filteredImmobili);
    });
};

// -- SHOW --
const show = (req, res) => {
    const id = req.params.id;
    const sql = `SELECT 
    I.*,
    P.id AS proprietario_id,
    P.telefono AS proprietario_telefono,
    P.email AS proprietario_email,
    P.nome AS proprietario_nome,
    R.id AS id_recensione,
    R.username,
    R.testo,
    R.data_creazione,
    R.gg_permanenza,
    R.valutazione,
    IFNULL((SELECT ROUND(AVG(valutazione)) 
            FROM recensioni 
            WHERE immobile_id = I.id), 0) AS media_valutazione
FROM 
    immobili I
LEFT JOIN 
    recensioni R 
ON 
    I.id = R.immobile_id
LEFT JOIN
    proprietari P
ON
P.id = I.proprietario_id
WHERE 
    I.id = ?;
`;

    connection.query(sql, [id], (err, results) => {
        if (err) res.status(500).json({ error: err });
        if (results.length == 0 || results[id] === null)
            res.status(404).json({ error: "Immobile non trovato" });

        const immobileObj = {
            id: results[0].id,
            proprietario_id: results[0].proprietario_id,
            proprietario_telefono: results[0].proprietario_telefono,
            proprietario_email: results[0].proprietario_email,
            proprietario_nome: results[0].proprietario_nome,
            descrizione_immobile: results[0].descrizione_immobile,
            testo_descrittivo: results[0].testo_descrittivo,
            stanze: results[0].stanze,
            bagni: results[0].bagni,
            letti: results[0].letti,
            metri_quadrati: results[0].metri_quadrati,
            immagine: req.imagePath + results[0].immagine,
            indirizzo: results[0].indirizzo,
            prezzo_notte: results[0].prezzo_notte,
            voto: results[0].voto,
            media_valutazione: results[0].media_valutazione,
            data_inserimento: results[0].data_inserimento,
            tipologia_id: results[0].tipologia_id,
            reviews: []
        }
        console.log(results)
        results.forEach(item => {
            immobileObj.reviews.push({
                id: item.id_recensione,
                username: item.username,
                testo: item.testo,
                data_creazione: item.data_creazione,
                gg_permanenza: item.gg_permanenza,
                valutazione: item.valutazione
            })
        })

        res.json(immobileObj)
    });
};

// -- STORE --
const store = (req, res) => {
    const errors = validateProperty(req.body);
    if (errors.length > 0) return res.status(400).json({ error: errors });

    //nome del file che è stato uploadato per l'immagine
    const imageName = req.file.filename

    const {
        descrizione_immobile,
        testo_descrittivo,
        stanze,
        bagni,
        letti,
        metri_quadrati,
        indirizzo,
        tipologia,
        voto,
        prezzo_notte
    } = req.body;

    const {
        nome,
        cognome,
        email,
        telefono
    } = req.body.proprietario

    // check esistenza proprietario
    const SQLcheckProprietario = "SELECT id FROM proprietari WHERE email = ?"
    connection.query(SQLcheckProprietario, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        console.log(results[0]);

        // se il proprietario non esiste viene inserito
        if (results.length === 0) {
            const SQLinsertProprietario = "INSERT INTO proprietari (nome, cognome, email,telefono) VALUES (?, ?, ?, ?)"

            connection.query(SQLinsertProprietario, [nome, cognome, email, telefono], (err) => {
                if (err) return res.status(500).json({ error: err });
            })

            // inserito il proprietario viene poi inserito l'immobile
            const SQLinsertImmobile = "INSERT INTO immobili (descrizione_immobile, testo_descrittivo, stanze, bagni, letti, metri_quadrati, indirizzo, immagine, tipologia_id, voto, prezzo_notte, proprietario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, LAST_INSERT_ID());"

            connection.query(SQLinsertImmobile, [descrizione_immobile, testo_descrittivo, stanze, bagni, letti, metri_quadrati, indirizzo, imageName, tipologia, voto, prezzo_notte], (err) => {
                if (err) return res.status(500).json({ error: err });
                return res.status(201).json({ message: "immobile e proprietario inseriti con successo" })
            })
        }

    })


};

// -- STORE RECENSIONI --
const storeReview = (req, res) => {
    const id = req.params.id;
    const { username, testo, gg_permanenza, valutazione } = req.body;

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
    if (valutazione < 1 || valutazione > 5 || isNaN(valutazione))
        return res.status(400).json({ error: "Valutazione non valida" })

    const sql =
        "INSERT INTO recensioni (immobile_id, username, testo, gg_permanenza, valutazione) VALUES (?,?,?,?,?);";

    connection.query(
        sql,
        [id, username, testo, gg_permanenza, valutazione],
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

// --UPDATE CUORICINI--
const modifyVote = (req, res) => {
    const id = req.params.id;

    const sql = `UPDATE immobili 
SET voto = IF(voto IS NULL, 1, voto + 1) 
WHERE id = ?;`;

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
    tipologieIndex

};
