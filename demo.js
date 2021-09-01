const mongoose = require("mongoose")
const express = require('express')
const app = express()
const port = 3000

app.use(express.json())

mongoose.connect("mongodb://localhost:27017/demo", { useNewUrlParser: true })
    .then(con => console.log("DB connected"))

const dataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    city: { type: String, required: true }
})

const data = new mongoose.model("data", dataSchema)

app.post("/add", (req, res) => {
    const newData = {
        name: req.body.name,
        age: req.body.age,
        city: req.body.city
    }
    data.create(newData)
    res.json(newData)
})

app.get("/get", (req, res) => {
    data.findOne({ $or: [{ name: req.body.name }, { age: req.body.age }, { city: req.body.city }]}, (err, docs) => {
        res.json(docs)
    })
})

app.post("/update", (req, res) => {
    data.findOneAndUpdate({ $or: [{ name: req.body.name }, { age: req.body.age }, { city: req.body.city }]},
        {name: req.body.name, age: req.body.age, city: req.body.city },{ new: true}, (err, docs) => {
            res.json(docs)
        })
})

app.post("/delete", (req, res) => {
    data.deleteOne({ $or: [{ name: req.body.name }, { age: req.body.age }, { city: req.body.city }]}, (err, docs) => {
        res.json(docs)
    })
})

app.listen(port, () => console.log(`listening on port ${port}!`))