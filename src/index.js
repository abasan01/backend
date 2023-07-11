import express from 'express'
import cors from 'cors'
import storage from './memory_storage'
import axios from 'axios'

const app = express()
const port = 3000

app.use(cors())

app.get('/knjige', (req, res) => {

    let search = req.query.search
    let data = storage.knjige

    console.log("search: ", search)

    if (search) {
        data = data.filter(doc => {
            // @ts-ignore
            return doc.naslov.indexOf(search) >= 0
        })
    }

    res.json(data)
});


console.log("test")

app.listen(port, () => console.log(`Slušam na portu ${port}!`))