const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 5000



// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.name}:${process.env.pass}@cluster0.f4myxpg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const userCollection = client.db("creative_hero").collection("user");
        const courseCollection = client.db("creative_hero").collection("course");



        // post user
        app.post('/user', async (req, res) => {
            const { userInfo } = req.body;


            const existingUser = await userCollection.findOne({ email: userInfo.email });
            if (existingUser) {
                console.log('User already exists');
                return res.send([]);
            }

            const result = await userCollection.insertOne(userInfo);
            console.log(result);
            res.send(result);
        });




        //   post course in instractor
        // TUDU: implement make instractor


        app.post('/course', async (req, res) => {
            const { data } = req.body;
            console.log({ data });
            const result = await courseCollection.insertOne(data);

            res.send(result);
        });



        app.get("/mycourse", async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const query = { instructorEmail: email };

            console.log(query);

            const result = await courseCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/update/:id', async (req, res) => {
            const id = req.params.id;
            const quiry = { _id: new ObjectId(id) }
            const result = await courseCollection.findOne(quiry);
            res.send(result);

        })

        app.put('/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateData = req.body;
            const update = {
              $set: {
                availableSeats: updateData.availableSeats,
                className: updateData.className,
                status: updateData.status,
                type: updateData.type,
                price: updateData.price,
                img: updateData.img,
              },
            };
          
            const result = await courseCollection.updateOne(filter, update);
            res.send(result);
          });
          



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);













app.get('/', (req, res) => {
    res.send('creative hero!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})