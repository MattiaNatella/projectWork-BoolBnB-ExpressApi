import connection from "../data/data.js";

const index = (req, res) => {

    const sql = 'SELECT * FROM immobili'

    connection.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: 'query al database fallita' });
        console.log(result)
        res.json(result)
    })

}

const show = (req, res) => {
    const id = req.params.id;
    res.send(`Sono la rotta show: ${id}`)
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