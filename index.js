// перед деплоем на хероку нужно не забывать удалять dotenv из зависимостей(dependencies) и закомментировать/удалить эту строчку, инчае будут конфликтовать dotenv из проекта и встроенный на хероку сервере dotenv(или что там используется для чтения env конфига), но для локальной разработки он нам нужен
// upd: чтобы каждый раз не удалять/устанавливать пакет dotenv, установил его в devDependencies, так как хероку по умолчанию не устанавливает зависимости из этой секции
// require("dotenv").config(); // на сервере heroku есть свой конфиг с переменными, все переменные нужно перенести туда

const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

// это временная мера, в следующем обновлении node-telegram-bot-api, это будет не нужно
process.env.NTBA_FIX_319 = 1;   // fix cancellation of promises https://github.com/yagop/node-telegram-bot-api/issues/319. module.js:652:30

const TelegramBot = require('node-telegram-bot-api');

let TOKEN = process.env.TOKEN || "";
const url = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;

// При использовании WebHook
const bot = new TelegramBot(TOKEN);

bot.setWebHook(`${url}/bot${TOKEN}`, {});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    // res.send("GET request to the homepage");
    res.status(200).end();
});

// POST method route
app.post(`/bot${TOKEN}`, (req, res) => {
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


// error handling
process.on("uncaughtException", (error) => {
    let time = new Date();
    console.log("=== uncaughtException ===");
    console.log("TIME:", time);
    console.log("NODE_CODE:", error.code);
    console.log("MSG:", error.message);
    console.log("STACK:", error.stack);
});

process.on("unhandledRejection", (error) => {
    let time = new Date();
    console.log("=== unhandledRejection ===");
    console.log("TIME:", time);
    console.log("NODE_CODE:", error.code);
    console.log("MSG:", error.message);
    console.log("STACK:", error.stack);
});