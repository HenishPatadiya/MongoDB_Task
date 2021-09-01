const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
    MongoClient
} = require("mongodb")
const express = require('express');
const app = express()
const port = 3000

app.use(express.json())
let flag = 0;

function signjwt(username, jwt) {
    return jwt.sign({
        username: username
    }, 'secret-key');
};

function verifyjwt(req, res, next) {
    let token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({
            error: 'token is required !'
        });
    }
    try {
        const tokendData = jwt.verify(token, 'secret-key');
        req.user = tokendData;
    } catch (err) {
        return res.status(401).json({
            error: 'Invalid Token'
        });
    }
    return next();
}

const url = "mongodb://localhost:27017/task"
const client = new MongoClient(url)
client.connect();

app.post('/signup', (req, res) => {
    // console.log(req.body);
    if (!req.body.username || !req.body.password) {
        return res.status(403).json({
            error: 'Please fill details'
        });
    }

    if (flag == 0) {
        const token = signjwt(req.body.username, jwt)
        let newUser
        // console.log(req.body.password);
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            // console.log(hash);
            newUser = {
                username: req.body.username,
                password: hash,
                todo: [],
            }

            client.db("task").collection("todo").insertOne(newUser)
            res.json(newUser)
        })
    }
    flag = 0
})

app.post('/login', verifyjwt, (req, res) => {
    if (!req.body.username || !req.body.password) {
        return res.status(403).json({
            error: 'Please fill all details'
        });
    }

    const result = client.db("task").collection("todo").findOne({
        username: req.body.username
    })
        .then(data => {
            (bcrypt.compare(req.body.password, data.password).then(dt => {
                if (dt) {
                    // console.log(dt);
                    flag = 1;
                    const token = signjwt(req.body.username, jwt)
                    if (jwt.verify(token, 'secret-key')) {
                        // udata.token = token
                        res.json(token)
                    } else {
                        res.status(401).json({
                            error: "Invalid"
                        })
                    }
                }
            }));

        })
    if (flag == 0) {
        return res.status(403).json({
            error: "Invalid details !"
        });
    }
    flag = 0;
})

app.get('/getTodo', verifyjwt, (req, res) => {
    // console.log(req.user.username);
    const result = client.db("task").collection("todo").findOne({
        username: req.user.username
    }).then(data => {
        res.json(data.todo);
    })
})

app.post('/addTodo', verifyjwt, (req, res) => {
    if (req.body.newTodo == null && req.body.newTodo == '') {
        return res.status(403).json({
            error: "Please, write somthing !"
        });
    }

    const result = client.db("task").collection("todo").findOne({
        username: req.user.username
    }).then(data => {
        data.todo.push(req.body.newTodo)
        client.db("task").collection("todo").updateOne({
            username: req.user.username
        }, {
            $set: {
                todo: data.todo
            }
        })
        res.json(data.todo);
    })
})

app.listen(port, () => console.log(`app listening on port ${port}!`))