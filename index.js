const express = require('express');
const cors = require('cors');
require('./db/config');
const User = require('./db/user');
const Product = require('./db/product');
const app = express();
app.use(express.json());
app.use(cors());

const jwt = require("jsonwebtoken");
const jwtKey = 'e-comm';

// signup API 
app.post("/register", async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject(); // this line remove the password when we can post the data
    delete result.password;
    jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            res.send({ result: "something went wrong" })
        }
        res.send({ result, auth: token });
    })
});

// login api
app.post('/login', async (req, res) => {
    console.log(req.body);
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    res.send({ result: "something went wrong" })
                }
                res.send({ user, auth: token });
            })

        } else {
            res.send({ result: "user not found" });
        }
    } else {
        res.send({ result: "user not found" });
    }

});

// add product api
app.post('/add-product', verifyToken, async (req, res) => {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
});

// get product list api

app.get('/get-product',verifyToken, async (req, res) => {
    let products = await Product.find();
    if (products.length > 0) {
        res.send(products)
    } else {
        res.send({ result: "result not found" })
    }

});

// delete api
app.delete("/product/:id",verifyToken, async (req, res) => {
    const result = await Product.deleteOne({ _id: req.params.id })
    res.send(result);

});

// get single product api

app.get('/get-product/:id',verifyToken, async (req, res) => {
    let result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.send(result);
    } else {
        res.send({ result: "result no found" });
    }

});

// api for update product

app.put('/get-product/:id',verifyToken, async (req, res) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    )
    res.send(result);
});

// api for searching

app.get('/search/:key', verifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }
        ]
    });
    res.send(result);
});


function verifyToken(req, res, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                return res.status(401).send({ result: "Provide a valid token" });
            } else {
                next();
            }
        });
    } else {
        return res.status(403).send({ result: "Add token to the header" });
    }
}


app.listen(5000);