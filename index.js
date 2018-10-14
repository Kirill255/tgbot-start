
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
    // res.send("GET request to the homepage");
    res.status(200).end();
});

// POST method route
app.post("/", function (req, res) {
    res.send("POST request to the homepage");
});

app.use(function (req, res, next) {
    res.status(404).send("Not found!");
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(PORT, () => console.log("Server start"));