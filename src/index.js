import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

//configs
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
/*
const mongoClient = new MongoClient(process.env.MONGO_URL);

const timeA = dayjs().format("HH/mm/ss");

//joi
const userSchema1 = joi.object({
  name: joi.string().required().min(1),
});
//joi

//configs

try {
  await mongoClient.connect();
} catch (err) {
  console.log(err);
}

const db = mongoClient.db("test");
const userCollection = db.collection("users");
const messagesCollection = db.collection("messages");
*/
const mongoClient = new MongoClient(process.env.MONGO_URL);
let nomeUsuario = "";
let db = null;
const timeA = dayjs().format("HH/mm/ss");
const userSchema1 = joi.object({
  name: joi.string().required().min(1),
});

const userSchema2 = joi.object({
  to: joi.string().required().min(1),
  text: joi.string().required().min(1),
  type: joi.string().valid("message").valid("private_message"),
});

try {
  await mongoClient.connect();
  db = mongoClient.db("BatePapoUol");
  console.log("conectado ao datacenter");
} catch (err) {
  console.log(err);
}
const userCollection = db.collection("users");
const messagesCollection = db.collection("messages");

//Rotas

app.post("/participants", async (req, res) => {
  const name = req.body;
  nomeUsuario = name;
  // console.log("Eu sou o req body",req.body);
  // console.log("Eu sou o name",name);

  try {
    const userExists = await userCollection.findOne({ name: name });
    if (userExists) {
      return res
        .status(409)
        .send({ message: "Esse nome já esta sendo utilizado" });
    }

    const validation = userSchema1.validate(name, { abortEarly: false });

    if (validation.error) {
      const erros = validation.error.details.map((detail) => detail.message);
      res.status(422).send(erros);
      return;
    }
    await userCollection.insertOne({
      name: name,
      lastStatus: Date.now(),
    });
    res.status(201).send({ message: "Ok!" });
  } catch (err) {
    res.status(500).send(err);
  }

  try {
    await messagesCollection.insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: timeA,
    });
    res.status(201).send({ message: "Ok!" });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participantsG = await userCollection.find({}).toArray();
    res.send(participantsG);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const messageContainer = { to, text, type };

  const validation = userSchema2.validate(messageContainer, {
    abortEarly: false,
  });

  try {
    // const userExists = await userCollection.findOne({ name: name });
    // if (userExists) {
    //   return res
    //     .status(409)
    //     .send({ message: "Esse nome já esta sendo utilizado" });
    // }

    if (validation.error) {
      const erros = validation.error.details.map((detail) => detail.message);
      res.status(422).send(erros);
      return;
    }
    // await userCollection.insertOne({
    //   name: name,
    //   lastStatus: Date.now(),
    // });
    res.status(201).send({ message: "Ok!" });
  } catch (err) {
    res.status(500).send(err);
  }

  try {
    await messagesCollection.insertOne({
      from: nomeUsuario,
      to: to,
      text: text,
      type: type,
      time: timeA,
    });
    res.status(201).send({ message: "Ok!" });
  } catch (err) {
    res.status(500).send(err);
  }
});


app.get("/messages", async (req, res) => {
  try {
    const messagesG = await messagesCollection.find({}).toArray();
    res.send(messagesG);
  } catch (err) {
    res.status(500).send(err);
  }
});


app.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});
