const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleWare
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bruh!!! Your Toy Server is Running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udnr6tc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//Mongo DB is Connecting
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const toyCollection = client.db("toy-db").collection("toys");

    //Searching Operation Code Here
    const indexKeys = { title: 1, category: 1 };
    const indexOptions = { name: "titleCategory" };

    const result = await toyCollection.createIndex(indexKeys, indexOptions);
    app.get("/toySearch/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await toyCollection
        .find({
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    //Add Toys/Post Toys
    app.post("/postToys", async (req, res) => {
      const body = req.body;
      //body valided
      if (!body) {
        return res.status(404).send({ message: "Your Toy Data isn't Found.." });
      }
      const result = await toyCollection.insertOne(body);
      res.send(result);
    });
    //Get Data
    app.get("/allToys", async (req, res) => {
      const result = await toyCollection.find({}).limit(20).toArray();
      res.send(result);
    });
    app.get("/allToys/detail/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });
    app.get("/allToys/:text", async (req, res) => {
      console.log(req.params.text);
      if (
        req.params.text == "mathkit" ||
        req.params.text == "engineerkit" ||
        req.params.text == "sciencekit"
      ) {
        const result = await toyCollection
          .find({ category: req.params.text })
          .toArray();
        return res.send(result);
      } else {
        const result = await toyCollection.find({}).toArray();
        res.send(result);
      }
    });
    app.get("/myToys/seller/:email", async (req, res) => {
      const body = req.params.email;

      const result = await toyCollection
        .find({ sellerEmail: body })
        .sort({ Price: -1 })
        .toArray();

      res.send(result);
    });
    app.delete("/myToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/myToys/update/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    app.put("/myToys/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateToy = req.body;
      const toys = {
        $set: {
          Price: updateToy.Price,
          quantity: updateToy.quantity,
          description: updateToy.description,
        },
      };
      const result = await toyCollection.updateOne(filter, toys, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Your Server is Running on PORT ${PORT}`);
});
