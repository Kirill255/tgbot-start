// перед деплоем на хероку нужно не забывать удалять dotenv из зависимостей(dependencies) и закомментировать/удалить эту строчку, инчае будут конфликтовать dotenv из проекта и встроенный на хероку сервере dotenv(или что там используется для чтения env конфига), но для локальной разработки он нам нужен
// upd: чтобы каждый раз не удалять/устанавливать пакет dotenv, установил его в devDependencies, так как хероку по умолчанию не устанавливает зависимости из этой секции
// require("dotenv").config(); // на сервере heroku есть свой конфиг с переменными, все переменные нужно перенести туда

const express = require("express");
const app = express();
const fetch = require("node-fetch");
const PORT = process.env.PORT || 5000;

// это временная мера, в следующем обновлении node-telegram-bot-api, это будет не нужно
process.env.NTBA_FIX_319 = 1;   // fix cancellation of promises https://github.com/yagop/node-telegram-bot-api/issues/319. module.js:652:30
// temporally fix https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
process.env.NTBA_FIX_350 = 1;

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
bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    if (msg.text) {
        let swear_words = ["хуй", "лох", "чмо"]; // добавьте другие запрещённые матерные слова
        let message = msg.text.toString().toLowerCase();
        swear_words.some(sw_word => {
            if (message.includes(sw_word)) {
                let messageId = msg.message_id;
                let name = msg.from.first_name;

                if (msg.chat.type !== "private") {

                    setTimeout(() => { bot.deleteMessage(chatId, messageId); }, 1500); // желательно сделать задержку при удалении

                }
                bot.sendMessage(chatId, `${name} не материтесь!`);
                return true; // прерываем выполнение цикла some, нам не нужно проверять весь массив 
            }
        });
    }

});

bot.onText(/\/start/i, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            one_time_keyboard: true,
            keyboard: [
                ["/menu"],
            ]
        })
    };
    bot.sendMessage(chatId, "Welcome", opts);
});

bot.onText(/\/menu/i, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            one_time_keyboard: true,
            keyboard: [
                ["Время сервера", "Погода"],
                ["Курс валют"]
            ]
        })
    };
    bot.sendMessage(chatId, 'Меню заказывали?', opts);
});

bot.on("text", (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);

    let hello = "привет";
    if (msg.text.toString().toLowerCase().indexOf(hello) === 0) { // только если слово "привет" идёт первым
        let name = msg.from.first_name;
        bot.sendMessage(chatId, `Привет дорогой пользователь ${name}`);
    }

    let bye = "пока";
    if (msg.text.toString().toLowerCase().includes(bye)) { // если фраза содержит слово "пока" в любом месте
        let name = msg.from.first_name;
        bot.sendMessage(chatId, `Надеюсь ещё увидимся, пока ${name}`);
    }

    let google = "google";
    if (msg.text.toString().toLowerCase().includes(google)) {
        const opts = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [
                        { text: "𝑮 Google", url: "http://google.com" },
                        { text: "Может 𝘠 Яндекс?", url: "http://ya.ru" }
                    ],
                ]
            })
        };
        bot.sendMessage(chatId, "Кто сказал Google?", opts);
    }
});

bot.onText(/Время сервера/, (msg) => {
    const chatId = msg.chat.id;
    let time = (new Date()).toLocaleTimeString();
    bot.sendMessage(chatId, time);
});

bot.onText(/Погода/, (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);
    const opts = {
        reply_to_message_id: msg.message_id,
        "reply_markup": JSON.stringify({
            "remove_keyboard": true
        })
    };
    bot.sendMessage(chatId, "Введите город", opts);

    const regexp2 = /.+/; // сохраним ссылку на regexp
    bot.onText(regexp2, async (msg, match) => { // async
        console.log('match :', match);
        // console.log('match[0] :', match[0]);

        let city = match;
        let unit = "metric";
        let lang = "ru";
        let urlWeatherAPI = "http://api.openweathermap.org/data/2.5/weather?q=";
        const APIKEYOWM = process.env.APIKEYOWM || "";
        let requestUrl = `${urlWeatherAPI}${city}&APPID=${APIKEYOWM}&units=${unit}&lang=${lang}`;

        let finalUrl = encodeURI(requestUrl);
        // console.log('requestUrl :', requestUrl);
        // console.log('finalUrl :', finalUrl);

        const opts = {
            "reply_markup": JSON.stringify({
                keyboard: [
                    ["/menu"]
                ],
                resize_keyboard: true
            })
        };

        try {
            let data = await fetch(finalUrl);
            let response = await data.json();
            // console.log('response :', response);

            if (response.cod === 200) {
                let city_name = response.name;
                let temp = response.main.temp;
                let description = response.weather[0].description;
                let grad = "\xB0"; // &deg; °
                let message = `Сейчас в городе ${city_name} ${temp}${grad}C и ${description}.`;
                // console.log('message :', message);

                bot.sendMessage(chatId, message, opts);
            } else if (response.cod === 429) {
                console.log('response 429 :', response);
                // code 429 - "Your account is temporary blocked due to exceeding of requests limitation of your subscription type. 

                bot.sendMessage(chatId, "Извините сервис не доступен, попробуйте позже", opts);
            } else {
                console.log("response else: ", response);

                bot.sendMessage(chatId, "Город не найден, попробуйте изменить регистр или язык ввода", opts);
            }
        } catch (error) {
            console.log("error: ", error);
        }

        bot.removeTextListener(regexp2); // удаляем слушателя по regexp ссылке
    });

});

bot.onText(/Курс валют/, (msg) => {
    let { id } = msg.chat;
    bot.sendMessage(id, "Выберите валюту:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "$ Доллар", callback_data: "USD" }, { text: "€ Евро", callback_data: "EUR" }],
            ]
        }
    })
});

bot.on("callback_query", async (query) => {
    const { id } = query.message.chat;
    const { data } = query;
    bot.answerCallbackQuery(query.id, {
        text: `Вы выбрали ${data}`
    });

    let base = data; // USD/EUR
    let symbols = "RUB"; // RUB
    let pair = `${base}_${symbols}`; // USD_RUB or EUR_RUB

    // https://www.emojicopy.com/
    let flag = {
        "RUB": "🇷🇺",
        "EUR": "🇪🇺",
        "USD": "🇺🇸"
    }

    // https://free.currencyconverterapi.com/api/v6/convert?q=USD_RUB&compact=y
    // https://free.currencyconverterapi.com/api/v6/convert?q=EUR_RUB&compact=y

    let url = "https://free.currencyconverterapi.com/api/v6/convert"
    // let finalUrl = `${url}?q=${base}_${symbols}&compact=y`;
    let finalUrl = `${url}?q=${pair}&compact=y`;
    try {
        let data = await fetch(finalUrl);
        let response = await data.json();
        // console.log('response :', response);
        let val = response[pair].val;

        let html = `Курс <em>${pair}:</em>\n<b>1</b>${flag[base]} ${base} 💱 <b>${val}</b>${flag[symbols]} ${symbols}.`;
        bot.sendMessage(id, html, {
            parse_mode: "HTML"
        });

    } catch (error) {
        console.log("error: ", error);
        bot.sendMessage(id, "Извините, сервис временно не работает!");
    }

});

bot.on("sticker", (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);
    const opts = {
        reply_to_message_id: msg.message_id
    };

    bot.sendMessage(chatId, "Я люблю стикеры!", opts)
        .then(_ => {

            const stickerPacks = ["ci_cat", "GoodBoyResistance", "podslushano"]; // добавьте название любого стикерпака
            let stickerPack = stickerPacks[Math.floor(Math.random() * stickerPacks.length)];
            // console.log('stickerPack :', stickerPack);

            bot.getStickerSet(stickerPack)
                .then(stickersSet => {
                    // console.log('stickersSet :', stickersSet);
                    let stickers = stickersSet.stickers;
                    let stickerItem = stickers[Math.floor(Math.random() * stickers.length)];
                    let stickerId = stickerItem.file_id;
                    bot.sendSticker(chatId, stickerId);
                });
        });
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