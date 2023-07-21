import express from 'express'
import cors from 'cors'
import connect from "./db.js"
import {
    getReads
} from "./goodreads"
import {
    getWiki
} from "./wiki.js"
import auth from "./auth.js"
import jwt from "jsonwebtoken"

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())
//getReads("Oliver Twist").then((result) => console.log(result))
//getWiki("J. D. Salinger").then((result) => console.log(result))

app.post('/liste', [auth.verify], async (req, res) => {
    try {
        const newList = req.body
        const header = req.headers.authorization
        const token = header.split(" ")
        const decoded = jwt.decode(token[1])
        const db = await connect()

        const data = await db.collection("lists").insertOne({
            name: newList.name,
            books: newList.books,
            // @ts-ignore
            createdBy: decoded.email,
            public: false
        })

        res.json(data)
    } catch (e) {
        console.error(e)
    }
})

app.patch('/liste', [auth.verify], async (req, res) => {
    try {
        const body = req.body
        console.log(body.id)
        var mongo = require('mongodb');
        const listId = new mongo.ObjectId(body.id)
        const db = await connect()

        const data = await db.collection("lists").updateOne({
            _id: listId
        }, {
            $set: {
                public: !body.state
            }
        })


        res.json(data.acknowledged)
    } catch (e) {
        console.error(e)
    }
})

app.delete('/liste', [auth.verify], async (req, res) => {
    try {
        const body = req.query.delete
        var mongo = require('mongodb');
        const listId = new mongo.ObjectId(body)

        console.log(listId)

        const db = await connect()

        const data = await db.collection("lists").deleteOne({
            _id: listId
        })

        res.json(data)
    } catch (e) {
        console.error(e)
    }
})

app.get('/liste', [auth.verify], async (req, res) => {
    try {

        const db = await connect()
        const cursor = await db.collection("lists").find({
            public: true
        })
        const docs = await cursor.toArray()

        let data = []

        var mongo = require('mongodb');

        for (const doc of docs) {
            let bookIds = doc.books.map(function (id) {

                return new mongo.ObjectId(id)
            })
            let pom = await db.collection("knjige").find({
                _id: {
                    $in: bookIds
                }
            })
            let pomArray = await pom.toArray()


            for (const element of pomArray) {
                const progress = await db.collection("progress").findOne({
                    bookId: element._id,
                })

                if (!progress) {
                    element.progress = false
                } else {
                    element.progress = progress.progress
                }
            }
            data.push({
                books: pomArray,
                list: doc
            })
        }

        res.json(data)

    } catch (e) {
        console.error(e)
    }
})

app.get('/', [auth.verify], async (req, res) => {
    try {
        const header = req.headers.authorization
        const token = header.split(" ")
        const decoded = jwt.decode(token[1])
        const db = await connect()
        const cursor = await db.collection("lists").find({
            // @ts-ignore    
            createdBy: decoded.email
        })
        const docs = await cursor.toArray()

        let data = []

        var mongo = require('mongodb');

        for (const doc of docs) {
            let bookIds = doc.books.map(function (id) {
                return new mongo.ObjectId(id)
            })
            let pom = await db.collection("knjige").find({
                _id: {
                    $in: bookIds
                }
            })
            let pomArray = await pom.toArray()


            for (const element of pomArray) {
                const progress = await db.collection("progress").findOne({
                    bookId: element._id,
                    // @ts-ignore
                    user: decoded.email
                })

                if (!progress) {
                    element.progress = false
                } else {
                    element.progress = progress.progress
                }
            }
            data.push({
                books: pomArray,
                list: doc
            })
        }

        res.json(data)
    } catch (e) {
        console.error(e)
    }
})

app.post('/auth', async (req, res) => {
    const user = req.body

    console.log(user)

    try {
        const result = await auth.authenticateUser(user.email, user.password); {
            console.log("ok")
        }
        res.json(result)
    } catch (e) {
        res.status(401).json({
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

app.post('/add', [auth.verify], async (req, res) => {

    try {

        let upload = req.body
        console.log(upload)

        let db = await connect();

        let data = await db.collection("knjige").insertOne(upload)

        if (data && data.acknowledged) {

            const readVars = await getReads(upload.title)

            if (readVars && readVars.title && readVars.imageUrl && readVars.year && readVars.description && readVars.genre && readVars.author && readVars.pages) {
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

                const author = await db.collection("authors").findOne({
                    name: result.author
                })
                if (!author) {
                    const authorVars = await getWiki(result.author);

                    console.log(authorVars)

                    if (authorVars) {
                        await db.collection("authors").insertOne(authorVars)
                    }

                }

                console.log(result)
                res.json(result)

            }
        } else {
            res.json({
                status: "fail"
            })
        }
    } catch (e) {
        console.error(e)
    }

});


// @ts-ignore
app.get('/setmissing', [auth.verify], async (req, res) => {
    let db = await connect()

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
                data.push(doc);

                const author = await db.collection("authors").findOne({
                    name: doc.author
                })
                if (!author) {
                    const authorVars = await getWiki(doc.author);

                    console.log(authorVars)

                    if (authorVars) {
                        await db.collection("authors").insertOne(authorVars)
                    }

                }
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

app.get('/knjige', [auth.verify], async (req, res) => {
    try {

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

app.get("/knjige/:id", [auth.verify], async (req, res) => {

    try {
        const header = req.headers.authorization
        const token = header.split(" ")
        const decoded = jwt.decode(token[1])
        const id = req.params.id

        var mongo = require('mongodb');
        var o_id = new mongo.ObjectId(id);

        const db = await connect();

        const book = await db.collection("knjige").findOne({
            _id: o_id

        })
        const searchTerm = book.author
            .replace(/\s*\.\s*/g, ".*");
        const termReg = new RegExp(searchTerm, "i");

        const author = await db.collection("authors").findOne({
            name: termReg
        });

        let progress = await db.collection("progress").findOne({
            bookId: o_id,
            // @ts-ignore
            user: decoded.email
        })

        if (!progress) {
            progress = false
        }

        const data = {
            author: author,
            book: book,
            progress: progress
        }

        res.json(data)

    } catch (e) {
        console.error("Error:", e)
    }
})

app.post("/knjige/:id", [auth.verify], async (req, res) => {

    try {
        const body = req.body

        console.log("body: ", body)
        const header = req.headers.authorization
        const token = header.split(" ")
        const decoded = jwt.decode(token[1])
        console.log("decoded: ", decoded)
        const id = req.params.id
        console.log("id: ", id)

        var mongo = require('mongodb');
        var o_id = new mongo.ObjectId(id);

        const db = await connect();

        const progress = await db.collection("progress").insertOne({
            bookId: o_id,
            // @ts-ignore
            user: decoded.email,
            progress: Number(body.progress)
        })

        res.json(progress)

    } catch (e) {
        console.error("Error:", e)
    }
})

app.patch("/knjige/:id", [auth.verify], async (req, res) => {

    try {
        const body = req.body
        const header = req.headers.authorization
        const token = header.split(" ")
        const decoded = jwt.decode(token[1])
        const id = req.params.id

        var mongo = require('mongodb');
        var o_id = new mongo.ObjectId(id);

        const db = await connect();

        const progress = await db.collection("progress").updateOne({
            bookId: o_id,
            // @ts-ignore
            user: decoded.email
        }, {
            $set: {
                progress: Number(body.progress)
            }
        })

        res.json(progress)

    } catch (e) {
        console.error("Error:", e)
    }
})

app.listen(port, () => console.log(`Slušam na portu ${port}!`))