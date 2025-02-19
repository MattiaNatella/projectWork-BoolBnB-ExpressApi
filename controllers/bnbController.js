const index = (req, res) => {
    res.send('Sono la rotta index')
}

const show = (req, res) => {
    const id = req.params.id;
    res.send(`Sono la rotta show: ${id}`)
}


export default {
    index,
    show
}