import {
    MongoClient
} from "mongodb"
import "dotenv/config";
const connection_string = `mongodb+srv://andrija3000:admin@knjigogram.m2asola.mongodb.net/?retryWrites=true&w=majority`;

let client = new MongoClient(connection_string);


let db = null;
export default () => {
    return new Promise((resolve, reject) => {
        if (db && client) {
            resolve(db);
        } else {
            client.connect().then(() => {
                console.log("uspješno spajanje");
                db = client.db("knjigogram");
                resolve(db);
            }).catch((e) => {
                reject("došlo je do greške " + e);
            });
        }
    });
};