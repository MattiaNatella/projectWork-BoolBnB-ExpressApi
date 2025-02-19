import connection from "../data/data.js";

const index = (req, res) => {

    const sql = 'SELECT * FROM immobili'

    connection.query(sql, (err, results) => {
        if (err) res.status(500).json({ error: 'query al database fallita' });
        console.log(results)
        res.json(results)
    })

}

const show = (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM immobili WHERE id = ?'

    connection.query(sql, [id], (err, results) => {
        if (err) res.status(500).json({ error: 'query al database fallita' });
        if (results.length == 0 || results[id] === null) res.status(404).json({ error: 'Immobile non trovato' });

        res.json(results[0])

    })


}

const store = (req, res) => {
    console.log(req.body)
    res.json(req.body)
}


export default {
    index,
    show,
    store
}