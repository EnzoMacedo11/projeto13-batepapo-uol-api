import express from "express"
import cors from "cors"
import {MongoClient} from "mongodb"

//configs
const app = express();
app.use(cors());
app.use(express.json());
const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;
//configs

app.post("/participants", (req, res) => {
    const { name } = req.body;
  
    if (!name) {
      res.status(422).send({ message: "Insira todos os campos por favor " });
      return;
    }
    const userLogin = {
      name,
      lastStatus: Date.now()
    };
    user.push(userLogin);
    res.status(201).send({ message: "Ok!" });
  });










app.listen(5000);