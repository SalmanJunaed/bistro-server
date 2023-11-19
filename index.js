const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require ('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//bistroBoss
//education17

// ACCESS_TOKEN_SECRET=09b9f03970ab6eb6d4901a08facb70f05cf6ae30e630f856627211e839e3fc9b26d6485dce94d0c46c18bdc7b3f49c0691d976e47979751f8ec2e582dfc29b79
// DB_USER=bistroBoss
// DB_PASS=education17


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rw04ymy.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://<username>:<password>@cluster0.rw04ymy.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();
        
        //DB collection
        const userCollection = client.db("bistroDB").collection("users");
        const menuCollection = client.db("bistroDB").collection("menu");
        const reviewCollection = client.db("bistroDB").collection("reviews");
        const cartCollection = client.db("bistroDB").collection("carts");



        //jwt related API
        app.post('/jwt', async(req, res) =>{
            const user = req.body;
            const token = jwt .sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '20d'});
            res.send({ token });
        })

        //middlewares 
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if(!req.headers.authorization){
                return res.status(401).send({massage: 'forbidden access'})
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if(err){
                    return res.status(401).send({message: 'forbidden access'})
                }
                req.decoded = decoded;
                console.log(decoded);
                
            })
            next();
        }
        
        //User related API - Get users
        app.get('/users', verifyToken, async(req, res) =>{
            // console.log(req.headers)
            const result = await userCollection.find().toArray();
            res.send(result);
        });


        //POST Users 
        app.post('/users', async (req, res) =>{
            const user = req.body;
            //insert email if user doesn't exists:
            //you can do it in many ways (1.email Unique, 2.upsert 3. simple checking)
            //way-3
            const query = {email: user.email}
            const existingUser = await userCollection.findOne(query);
            if(existingUser){
                return res.send({ message:'user Already exist', insertedId: null })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        //Make Admin PATCH Operation
        app.patch('/users/admin/:id', async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)};
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) =>{
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // Menu related APIs 
        //GET menu 
        app.get('/menu', async(req, res)=>{
            const result = await menuCollection.find().toArray();
            res.send(result);
        })
        //GET Review
        app.get('/reviews', async(req, res)=>{
            const result = await reviewCollection.find().toArray();
            res.send(result);
        })

        //Carts collection

        // POST single Cart data by single user
        app.post('/carts', async(req, res) => {
            const cartItem = req.body;
            const result = await cartCollection.insertOne(cartItem);
            res.send(result);
        })

        // Get to load data of single user cart
        app.get('/carts', async (req, res)=>{
            const email = req.query.email;
            const query = {email: email}
            const result = await cartCollection.find(query).toArray();
            res.send(result)
        })

        // Delete from cart data
        app.delete('/carts/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })



            // Send a ping to confirm a successful connection
            await client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
        } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res)=>{
    res.send('Bossing is Working Well')
})

app.listen(port, () => {
    console.log(`Bistro boss is sitting on port ${port}`);
})

