const setImagePath = (req, res, next) => {
    req.imagePath = `${req.protocol}://${req.get('host')}/img/`
    next()
}

export default setImagePath