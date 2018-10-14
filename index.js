// require("dotenv").config(); // на сервере heroku есть свой конфиг с переменными, все переменные нужно перенести туда

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000

const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const qs = require("querystringify");

const API = "https://api.telegram.org/bot";
const PROXY = process.env.PROXY || ""; // прокси бесплатные беру тут https://hidemyna.me/ru/proxy-list/?type=s#list  https://www.sslproxies.org/ , платные прокси можно вынести в конфиг
let TOKEN = process.env.TOKEN || "";
const BASE_URL = `${API}${TOKEN}/`; // https://api.telegram.org/bot<token>/
let url = "";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    // res.send("GET request to the homepage");
    res.status(200).end();
});

// POST method route
app.post("/", (req, res) => {
    // res.send("POST request to the homepage");
    let data = req.body;
    let chat_id = data.message.chat.id;
    sendRequest("sendMessage", { "chat_id": chat_id, "text": new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) })
        .catch(ex => console.log(ex.message));

    res.status(200).end();
});

app.use((req, res, next) => {
    res.status(404).send("Not found!");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(PORT, () => console.log("Server start"));


const sendRequest = async (method, params = {}) => {

    url = `${BASE_URL}${method}`; // https://api.telegram.org/bot<token>/METHOD_NAME

    if (Object.keys(params).length) {
        let query = qs.stringify(params, true); // ?chat_id=id&text=text
        url = `${url}${query}`; // https://api.telegram.org/bot<token>/METHOD_NAME?chat_id=id&text=text
    }
    console.log("url :", url);

    try {
        let response = null;

        if (process.env.PROXY) {
            response = await fetch(url, { agent: new HttpsProxyAgent(PROXY) });
        } else {
            response = await fetch(url);
        }

        const { result } = await response.json();
        // console.log("result1 :", result);

        return result;
    } catch (error) {
        console.log("error: ", error);
    }
}
