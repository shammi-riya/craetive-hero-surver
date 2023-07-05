const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 5000



// middleware
app.use(cors());
app.use(express.json());
var jwt = require('jsonwebtoken');




const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    console.log(authorization);

    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.userToken, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }

        req.decoded = decoded;
        next();
    });
};



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
        const selectCourseCollection = client.db("creative_hero").collection("select");
        const feedbackCollection = client.db("creative_hero").collection("feedback");




        // jwt 

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.userToken, { expiresIn: '1h' })
            res.send({ token });
        })



        app.post('/feeddback', async (req, res) => {
            const body = req.body;
            const result = await feedbackCollection.insertOne(body);
            res.send(result);
        })

        app.get('/feedback', async (req, res) => {
            const result = await feedbackCollection.find().toArray();
            res.send(result);
        })


        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;

            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user?.role !== "admin") {
                return res.status(403).send({ error: true, message: "Unauthorized Access" });
            }
            next();
        };









        const verifyInstractor = async (req, res, next) => {
            const email = req.decoded.email;
            const quiry = { email: email }
            const user = await userCollection.findOne(quiry);
            if (user?.role !== 'instractor') {
                return res.status(403).send({ error: true, message: "Unauthorized Access" });
            }

            next()

        }


        app.get('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const quiry = { email: email }

            const user = await userCollection.findOne(quiry);
            const result = { admin: user?.role == "admin" }
            res.send(result);
        })


    //     app.get('/instractor', (req, res) => {
    //         const result = 
    //   const instractor = await userCollection.find()
    //     })


        app.get('/user/instractor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                res.send({ isInstractor: false })
            }

            const quiry = { email: email };
            const user = await userCollection.findOne(quiry);
            const result = { instractor: user?.role == "instractor" };
            res.send(result)
        })

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


        app.get('/users',  async  (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })
        // 

        //   post course in instractor
        // TUDU: implement make instractor


        app.post('/course', async (req, res) => {
            const { data } = req.body;
            console.log({ data });
            const result = await courseCollection.insertOne(data);

            res.send(result);
        });



        app.get("/mycourse", verifyJWT, async (req, res) => {
            const email = req.query.email;

            const query = { instructorEmail: email };

            console.log(query);

            const result = await courseCollection.find(query).toArray();
            res.send(result);
        });



        // get all course
        app.get("/allcourse", async (req, res) => {
            const result = await courseCollection.find().toArray();
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



        // cart collection


        app.post('/selectclass', async (req, res) => {
            const item = req.body;
            console.log(item);

            try {
                const existingSelection = await selectCourseCollection.findOne({ _id: item._id });
                if (existingSelection) {
                    res.status(400).json({ error: 'This class has already been selected.' });
                    return;
                }

                const result = await selectCourseCollection.insertOne(item);
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'An error occurred while selecting the class.' });
            }
        });




        app.get('/selectcourse', async (req, res) => {
            const email = req.query.email;



            const quiry = { email: email }
            const result = await selectCourseCollection.find(quiry).toArray();

            res.send(result);
        })



        // deleteclass

        app.delete('/deleteCourse/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const quiry = { _id: id };
            const result = await selectCourseCollection.deleteOne(quiry);
            console.log(result);
            res.send(result);
        })






        // handle class

        app.patch("/allClass/Approve/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    stutus: "Approve"
                },
            };


            const result = await courseCollection.updateOne(filter, updateDoc);
            res.send(result);
        })




        // create admin

        app.patch("/admin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }

            const result = await userCollection.updateOne(filter, updateDoc);

            res.send(result)
        })


        app.patch('/instractor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instractor'
                }
            }
            const result = userCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(filter);
            res.send(result);
        })









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