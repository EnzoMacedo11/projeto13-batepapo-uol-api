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

const mongoClient = new MongoClient(process.env.MONGO_URL);
let db = null;
const timeA = dayjs().format("HH:mm:ss");
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
  //console.log("conectado ao datacenter");
} catch (err) {
  console.log(err);
}
const userCollection = db.collection("users");
const messagesCollection = db.collection("messages");

//Rotas

app.post("/participants", async (req, res) => {
  const name = req.body;
  // console.log("Eu sou o req body",req.body);
  // console.log("Eu sou o name",name);

  const validation = userSchema1.validate(name, { abortEarly: false });

  if (validation.error) {
    const erros = validation.error.details.map((detail) => detail.message);
    res.status(422).send(erros);
    return;
  }

  try {
    const userExists = await userCollection.findOne({ name: name });
    if (userExists) {
      return res
        .status(409)
        .send({ message: "Esse nome já esta sendo utilizado" });
    }

    await userCollection.insertOne({
      name: name,
      lastStatus: Date.now(),
    });
  } catch (err) {
    res.status(500).send(err);
  }


  try {
    await messagesCollection.insertOne({
      from: name.name,
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
  const user = req.headers;
  //console.log("Eu sou user",user)
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
  } catch (err) {
    res.status(500).send(err);
  }

  try {
    await messagesCollection.insertOne({
      from: user.user,
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
  const user = req.headers;
  let { limit } = req.query;
  try {
    const messagesG = await messagesCollection.find({}).toArray();
    const arrayAux = [];
    for (let i = 0; i < messagesG.length; i++) {
      if (
        messagesG[i].to === user ||
        messagesG[i].type !== "private_message" ||
        messagesG[i].type === "status" ||
        messagesG[i].from === user
      )
        arrayAux.push(messagesG[i]);
    }
    if (!limit) {
      limit = arrayAux.length;
    }
    const limitMessages = arrayAux.slice(0, limit);

    res.send(limitMessages);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/status", async (req, res) => {
  const user = req.headers;
  //console.log("Eu sou o user", user);

  const userExists = await userCollection.findOne({ name: user });
  if (!userExists) {
    return res.status(404).send({ message: "O participante não existe" });
  }

  try {
    await userCollection.updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    );
    res.status(200).send({ message: "Ok!" });
  } catch (err) {
    res.status(500).send(err);
  }
});

async function limpaUsuarios() {
  const users = await db.collection("users").find({}).toArray();
  //console.log("função limpaUsuarios", users)
  for (let i = 0; i < users.length; i++) {
   //console.log((Date.now() - users[i].lastStatus ) > 10000 );
    console.log("if console.log", users[i])
    if((Date.now()- new Date(users[i].lastStatus)) > 10000 ){
      //console.log("if console.log", users[i])
     
      try {
        await db.collection("users").deleteOne({name:users[i].name})

        await messagesCollection.insertOne({
          from: users[i].name.name,
          to: "Todos",
          text: "sai da sala...",
          type: "status",
          time: timeA,
        });
    }catch(err){
      res.status(500).send(err);
    }
  }
}}

app.listen(5000, () => {
  console.log("Rodando em http://localhost:5000")
  setInterval(limpaUsuarios, 15000)
  ;
})
