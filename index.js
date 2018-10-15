// перед деплоем на хероку нужно не забывать удалять dotenv из зависимостей(dependencies) и закомментировать/удалить эту строчку, инчае будут конфликтовать dotenv из проекта и встроенный на хероку сервере dotenv(или что там используется для чтения env конфига), но для локальной разработки он нам нужен
// upd: чтобы каждый раз не удалять/устанавливать пакет dotenv, установил его в devDependencies, так как хероку по умолчанию не устанавливает зависимости из этой секции
require("dotenv").config(); // на сервере heroku есть свой конфиг с переменными, все переменные нужно перенести туда

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000

const TelegramBot = require('node-telegram-bot-api');

// const PROXY = process.env.PROXY || "";
let TOKEN = process.env.TOKEN || "";
const url = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;

// При использовании getUpdates
// а также в России telegram заблокирован, поэтому нужно использовать proxy
// const bot = new TelegramBot(TOKEN, {
//     polling: true,
//     request: {
//         proxy: PROXY
//     },
// });

// При использовании WebHook
const bot = new TelegramBot(TOKEN);

bot.setWebHook(`${url}/bot${TOKEN}`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    // res.send("GET request to the homepage");
    res.status(200).end();
});

// POST method route
app.post("/", (req, res) => {
    bot.processUpdate(req.body);
    // res.status(200).end();
    res.sendStatus(200);
});

app.use((req, res, next) => {
    res.status(404).send("Not found!");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(PORT, () => console.log("Server start"));



// Listen for any kind of message. There are different kinds of messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    let time = new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, time);
});



/* 
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
 */