import express from 'express'
import cors from 'cors'
import storage from './memory_storage'
import axios from 'axios'
import connect from "./db.js"
import {
    Cheerio
} from 'cheerio'
import {
    getWiki
} from './wiki'
import {
    getReads
} from "./goodreads"

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())


app.post('/upload', (req, res) => {

    console.log(req.body)


    let upload = req.body

    let data = storage.knjige

    data.push(upload)

    res.json(upload)
});


app.get('/knjige', async (req, res) => {
    let db = await connect()

    let cursor = await db.collection("knjige").find().sort({
        naslov: 1
    })

    let data = []

    try {
        const docs = await cursor.toArray();

        for (const doc of docs) {
            if (doc.hasOwnProperty("imageUrl")) {
                data.push(doc);
            } else {
                let imageUrl = await getReads(doc.naslov)

                await db.collection("knjige").updateOne({
                    _id: doc._id
                }, {
                    $set: {
                        imageUrl: imageUrl
                    }
                });

                data.push(doc);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
    res.json(data);

});


app.get('/knjige_memory', (req, res) => {

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