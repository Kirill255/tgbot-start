// express сервер нам временно не нужен, мы его создали и задеплоили на heroku
// получили ссылку на наше приложении https://tgbot-start.herokuapp.com
// и теперь нам нужно установить webhook на этот адрес

// const express = require("express");
// const app = express();
// const PORT = process.env.PORT || 5000

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.get("/", function (req, res) {
//     // res.send("GET request to the homepage");
//     res.status(200).end();
// });

// // POST method route
// app.post("/", function (req, res) {
//     res.send("POST request to the homepage");
// });

// app.use(function (req, res, next) {
//     res.status(404).send("Not found!");
// });

// app.use(function (err, req, res, next) {
//     console.error(err.stack);
//     res.status(500).send("Something broke!");
// });

// app.listen(PORT, () => console.log("Server start"));

//=========================

require("dotenv").config();

const fetch = require("node-fetch");
const HttpsProxyAgent = require("https-proxy-agent");
const qs = require("querystringify");

const API = "https://api.telegram.org/bot";
const PROXY = process.env.PROXY || "http://118.174.211.219:3128"; // прокси бесплатные беру тут https://hidemyna.me/ru/proxy-list/?type=s#list  https://www.sslproxies.org/ , платные прокси можно вынести в конфиг
let TOKEN = process.env.TOKEN || "";

const BASE_URL = `${API}${TOKEN}/`; // https://api.telegram.org/bot<token>/
let url = "";

// Нужно установить webhook с помощью метода setWebhook

let method = "setWebhook"
url = `${BASE_URL}${method}`; // https://api.telegram.org/bot<token>/setWebhook
let query = qs.stringify({ "url": "https://tgbot-start.herokuapp.com" }, true); // ?url=https://tgbot-start.herokuapp.com
url = `${url}${query}`; // https://api.telegram.org/bot<token>/setWebhook?url=https://tgbot-start.herokuapp.com

// console.log("url :", url);

fetch(url, { agent: new HttpsProxyAgent(PROXY) })
    .then(response => response.json())
    .then(res => console.log("res: ", res)) // в ответ должны получить { ok: true, result: true, description: 'Webhook was set' }
