import express from 'express'
import cors from 'cors'
import connect from "./db.js"
import {
    getReads
} from "./goodreads"
import auth from "./auth.js"

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

//getReads("Oliver Twist").then((result) => console.log(result))

app.get('/tajna', [auth.verify], async (req, res) => {
    console.log("hello?")
    res.json({
        message: "ovo je tajna" + req.jwt.email
    })

})

app.post('/auth', async (req, res) => {
    const user = req.body

    try {
        const result = await auth.authenticateUser(user.email, user.password); {
            console.log("ok")
        }
        res.json(result)
    } catch (e) {
        res.status(403).json({
            error: e.message
        })
    }

})

app.post('/users', async (req, res) => {
    const user = req.body
    try {
        let savedDoc = await auth.registerUser(user)
        res.json(savedDoc)
    } catch (e) {
        res.status(500).send({
            error: e.message
        })
    }

})

app.post('/add', async (req, res) => {

    let upload = req.body
    console.log(upload)

    let db = await connect();

    let data = await db.collection("knjige").insertOne(upload)

    if (data && data.acknowledged) {

        const readVars = await getReads(upload.title)

        if (readVars) {
            console.log(data.insertedId)
            await db.collection("knjige").updateOne({
                _id: data.insertedId
            }, {
                $set: {
                    title: readVars.title,
                    imageUrl: readVars.imageUrl,
                    year: readVars.year,
                    description: readVars.description,
                    genre: readVars.genre,
                    author: readVars.author,
                    pages: readVars.pages
                }
            });
            console.log(data.insertedId)
            let result = await db.collection("knjige").findOne({
                _id: data.insertedId
            })
            console.log(result)
            res.json(result)

        }
    } else {
        res.json({
            status: "fail"
        })
    }

});

app.get('/setall', async (req, res) => {
    let db = await connect()

    let cursor = await db.collection("knjige").find().sort({
        title: 1
    })

    let data = []
    try {
        const docs = await cursor.toArray();

        for (const doc of docs) {
            const readVars = await getReads(doc.title)
            if (readVars) {

                await db.collection("knjige").updateOne({
                    _id: doc._id
                }, {
                    $set: {
                        title: readVars.title,
                        imageUrl: readVars.imageUrl,
                        year: readVars.year,
                        description: readVars.description,
                        genre: readVars.genre,
                        author: readVars.author,
                        pages: readVars.pages
                    }
                });
            }
            data.push(doc);
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
    console.log("Done!")
    res.json(data);

});

app.get('/setmissing', async (req, res) => {
    let db = await connect()

    let id = '64b130911bbf0c4d6b7e3c08'

    var mongo = require('mongodb');
    var o_id = new mongo.ObjectId(id);

    let cursor = await db.collection("knjige").find().sort({
        title: 1
    })

    let data = []
    try {
        const docs = await cursor.toArray();

        for (const doc of docs) {
            if (!doc.hasOwnProperty("imageUrl") || !doc.hasOwnProperty("year") || !doc.hasOwnProperty("description") ||
                !doc.hasOwnProperty("genre") || !doc.hasOwnProperty("author") || !doc.hasOwnProperty("pages")) {
                const readVars = await getReads(doc.title)

                if (readVars) {

                    await db.collection("knjige").updateOne({
                        _id: doc._id
                    }, {
                        $set: {
                            title: readVars.title,
                            imageUrl: readVars.imageUrl,
                            year: readVars.year,
                            description: readVars.description,
                            genre: readVars.genre,
                            author: readVars.author,
                            pages: readVars.pages
                        }
                    });
                }

                data.push(doc);


            } else {
                console.log(doc._id == o_id)

                data.push(doc);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
    console.log("Done!")
    res.json(data);

});

app.get('/knjige', async (req, res) => {
    let searchTerm = req.query.search
    let search = {
        $and: [{}]
    }
    if (searchTerm) {
        let searchArray = String(searchTerm).split(" ")

        searchArray.forEach((term) => {
            let termReg = RegExp(term, "i")
            let or = {
                $or: [{
                    title: termReg
                }, {
                    author: termReg
                }]
            }
            search.$and.push(or)
        })
    }
    try {
        let db = await connect();

        let cursor = db.collection("knjige").find(search).sort({
            title: 1
        });

        let documents = await cursor.toArray();
        res.json(documents);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

app.get("/knjige/:id", async (req, res) => {


    try {
        let id = req.params.id

        var mongo = require('mongodb');
        var o_id = new mongo.ObjectId(id);

        let db = await connect();

        let data = await db.collection("knjige").findOne({
            _id: o_id

        })
        res.json(data)

    } catch (e) {
        console.error("Error:", e)
    }


})

app.listen(port, () => console.log(`Slušam na portu ${port}!`))