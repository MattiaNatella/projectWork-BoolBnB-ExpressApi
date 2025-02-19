const index = (req, res) => {
    res.send('Sono la rotta index')
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