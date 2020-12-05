import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "Cors";
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1118187",
  key: "f148752ff981b24197d1",
  secret: "de511b50f0dfbdd4b7e3",
  cluster: "eu",
  useTLS: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("Db is connected");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetials = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetials.name,
        message: messageDetials.message,
        received: messageDetials.recived,
      });
    } else {
      console.log("Error trigger Pusher");
    }
  });
});

//middleware
app.use(express.json());
app.use(cors());
//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
const connection_url =
  "mongodb+srv://admin:TICFoXb29yi8H1nd@cluster0.snqyr.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
//listen

app.listen(port, () => console.log("Listening on localhost:" + port));
