import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import notFoundHandler from './assets/middlewares/notFoundHandler.js'
import errorHandler from './assets/middlewares/errorHandler.js'


const app = express()
const port = process.env.PORT || 3000 || 3001 || 3002;

//definisco i client autorizzati all'accesso
app.use(cors())

//middleware per rendere accedibile lato client il contenuto della cartella public
app.use(express.static('public'))

//Middleware per il parse del body della request
app.use(express.json())



//definisco un entrypoint per il server
app.get('/', (req, res) => {
    res.send('Indirizzo del server BoolBnB')
})



//Middleware gestione errori
app.use(errorHandler)


//middleware per gestiore errore 404
app.use(notFoundHandler)

app.listen(port, () => {
    console.log(`sono in ascolto sulla porta ${port} `)
})


