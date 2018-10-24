
require("dotenv").config();

const fs = require("fs");
const express = require("express");
const fetch = require('node-fetch');
const request = require('request');
const app = express();
const PORT = process.env.PORT || 5000;

// temporally fix cancellation of promises https://github.com/yagop/node-telegram-bot-api/issues/319. module.js:652:30
process.env.NTBA_FIX_319 = 1;
// temporally fix https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
process.env.NTBA_FIX_350 = 1;

const TelegramBot = require('node-telegram-bot-api');

let TOKEN = process.env.TOKEN || "";
const PROXY = process.env.PROXY || ""; // https://hidemyna.me/ru/proxy-list/?type=s#list

// https://github.com/yagop/node-telegram-bot-api/blob/master/examples/polling.js

const bot = new TelegramBot(TOKEN, {
    polling: true,
    request: {
        proxy: PROXY
    },
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    // res.send("GET request to the homepage");
    res.status(200).end();
});

// POST method route
// app.post(`/bot${TOKEN}`, (req, res) => {
//     bot.processUpdate(req.body);
//     // res.status(200).end();
//     res.sendStatus(200);
// });

app.use((req, res, next) => {
    res.status(404).send("Not found!");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(PORT, () => console.log("Server start"));


// библиотека node-telegram-bot-api при отправке файлов работает со стримами, буффером, урлом https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files, поэтому для отправки файлов вам нужно на это ориентироваться, например библиотека request очень хорошо работает со стримами, можно получить файл простым запросом `const file = request(url);` и дальше сразу передать его боту, а например библиотека node-fetch может работать с буффером, поэтому после получения файла, нужно сначала преобразовать его в буффер, а затем передовать боту ( помоему она может работать и со стримами, но не так очевидно как request ), в общем при выборе библиотеки для запросов, нужно понимать как они работают под капотом и какие возможности предоставляют


bot.onText(/\/start/, (msg) => {
    const opts = {
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            one_time_keyboard: true,
            keyboard: [
                ["/menu", "/help"],
            ]
        })
    };
    bot.sendMessage(msg.chat.id, "Welcome", opts);
});

bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            one_time_keyboard: true,
            keyboard: [
                [{ text: "Оставить контакты" }],
                [{ text: "Получить картинку" }, { text: "Получить аудио" }], // можно так
                ["Сколько время", "Погода"], // или так
            ]
        })
    };
    bot.sendMessage(chatId, 'Меню заказывали?', opts);
});

bot.onText(/\/help/, (msg) => {
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
    bot.sendMessage(chatId, 'Просто нажмите меню!', opts);
});


// Listen for any kind of message. There are different kinds of messages.
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);

    // событие "message" универсальное, срабатывает на сообщения любого типа, для обработки конкретного типа лучше всего воспользоваться нужным событием https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#events , при использовании события "message" стоит делать некоторые проверки, например при описании логики ответа на текстовые сообщения стоит проверять `if (msg.text)`, так как без этой проверки будет выпадать ошибка, при принятии какого-либа сообщения с типом у которого нет поля "text", например "Contact"
    if (msg.text) {
        let swear_words = ["хуй", "лох", "чмо"]; // добавьте другие запрещённые матерные слова
        let message = msg.text.toString().toLowerCase();
        swear_words.some(sw_word => {
            if (message.includes(sw_word)) {
                let messageId = msg.message_id;
                let name = msg.from.first_name;
                // удалить сообщение в приватном чате с ботом нельзя, только группы и каналы https://t.me/botoid/401183 , тоесть только когда вашего бота добавят в канал и там он сможет удалять сообщения содержащие мат
                if (msg.chat.type !== "private") {
                    // bot.deleteMessage(chatId, messageId); // https://github.com/yagop/node-telegram-bot-api/issues/653#issuecomment-424701973
                    setTimeout(() => { bot.deleteMessage(msg.chat.id, msg.message_id); }, 1500); // желательно сделать задержку при удалении

                }
                bot.sendMessage(chatId, `${name} не материтесь!`);
                return true; // прерываем выполнение цикла some, нам не нужно проверять весь массив 
            }
        });
    }

    bot.sendMessage(chatId, "Я клёвый бот");
});


bot.on("text", (msg) => {
    // console.log('msg :', msg);
    const chatId = msg.chat.id;

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

    let location = "location";
    if (msg.text.toString().toLowerCase().indexOf(location) === 0) {
        bot.sendLocation(msg.chat.id, 59.127406, 37.906920);
        bot.sendMessage(msg.chat.id, "Here is the Cherepovets");

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

bot.onText(/\/inline/, (msg) => {
    const chatId = msg.chat.id;
    var opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Кнопка", callback_data: "кнопка" }],
                [{ text: "1", callback_data: "1" }, { text: "2", callback_data: "2" }, { text: "3", callback_data: "3" }],
                [{ text: "4", callback_data: "4" }, { text: "5", callback_data: "5" }]
            ]
        }

    };
    bot.sendMessage(chatId, "Выберите цифру", opts);
});

bot.on("callback_query", (callbackQuery) => {
    // const chatId = callbackQuery.message.chat.id;
    const callback_query_id = callbackQuery.id; // это важно!! для .answerCallbackQuery() нужен именно callback_query_id, а не chatId
    console.log("callbackQuery", callbackQuery);
    let data = callbackQuery.data;
    // Чисто для примера как можно обрабатывать запрос
    if (data === "кнопка") {
        const opts = {
            text: "Вы нажали на кнопку",
            // show_alert: true,
        };
        bot.answerCallbackQuery(callback_query_id, opts);
    } else {
        console.log('Нажали :', data);
        const opts = {
            text: `Вы нажали ${data}`,
            // show_alert: true,
        };
        bot.answerCallbackQuery(callback_query_id, opts);
    }

    // bot.sendMessage(chatId, "Привет из callback_query");
});

bot.onText(/Получить картинку/, (msg) => {
    const chatId = msg.chat.id;
    const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            one_time_keyboard: true,
            keyboard: [
                [
                    { text: "С собачкой" },
                    { text: "С котиком" },
                    { text: "С мишкой" }
                ],
                ["/menu"]
            ]
        })
    };
    bot.sendMessage(chatId, 'Картинку с кем?', opts);
});

bot.onText(/С собачкой/, async (msg) => {
    const chatId = msg.chat.id;

    // напрямую передаём просто ссылку на файл

    // const url = "http://infobreed.ru/foto_breed/126/pincher3.jpg";
    // bot.sendPhoto(chatId, url, {
    //     caption: "Вот собачка!"
    // });

    // node-fetch and convert to buffer

    // fetch('http://infobreed.ru/foto_breed/126/pincher3.jpg')
    //     .then((response) => response.buffer())
    //     .then((buffer) => {
    //         console.log('data :', buffer);
    //         bot.sendPhoto(chatId, buffer, {
    //             caption: "Вот собачка!"
    //         });
    //     })
    //     .catch((error) => console.log('error: ', error));

    // node-fetch and convert to buffer (async/await)

    // try {
    //     let response = await fetch('http://infobreed.ru/foto_breed/126/pincher3.jpg');
    //     let buffer = await response.buffer();
    //     bot.sendPhoto(chatId, buffer, {
    //         caption: "Вот собачка!"
    //     });
    // } catch (error) {
    //     console.log('error: ', error);
    // }

    // request (works by default with streams)

    const url = 'http://infobreed.ru/foto_breed/126/pincher3.jpg';
    const photo = request(url);
    // bot.sendPhoto(chatId, photo); // send just photo, without caption
    bot.sendPhoto(chatId, photo, { // send as image
        caption: "Вот собачка!"
    });
});

bot.onText(/С котиком/, (msg) => {
    const chatId = msg.chat.id;
    const photo = "http://oboi.cc/1440-900-100-uploads/new/big/oboik.ru_8187.jpg";
    bot.sendPhoto(chatId, photo, {
        caption: "Вот котик!"
    });
});

bot.onText(/С мишкой/, (msg) => {
    const chatId = msg.chat.id;
    const photo = "http://price-top.ru/public/images/products/309/59/58558/641ffab083.jpg";
    bot.sendPhoto(chatId, photo, {
        caption: "Вот мишка!"
    });
});

bot.onText(/Сколько время/, (msg) => {
    const chatId = msg.chat.id;
    let time = new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    bot.sendMessage(chatId, time);
});

bot.onText(/Получить аудио/, (msg) => {
    // From HTTP request
    const url = 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg';
    const audio = request(url);
    bot.sendAudio(msg.chat.id, audio);
});

bot.onText(/Погода/, (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);
    const opts = {
        reply_to_message_id: msg.message_id,
        "reply_markup": {
            "remove_keyboard": true
        }
    };
    bot.sendMessage(chatId, "Введите город", opts);

    const regexp2 = /.+/;
    bot.onText(regexp2, (msg, match) => {
        console.log('match :', match);

        // https://openweathermap.org
        // forecast - прогноз на неделю, weather - погода сейчас
        // http://api.openweathermap.org/data/2.5/forecast?id=524901&APPID={APIKEY} // по id города 
        // http://api.openweathermap.org/data/2.5/weather?q=London&APPID={APIKEY} // по названию

        // let city = "Москва";
        // let city = "Moscow";
        // let city = "Череповец";
        let city = match;
        let unit = "metric";
        let lang = "ru";
        let urlWeatherAPI = "http://api.openweathermap.org/data/2.5/weather?q=";
        const APIKEYOWM = process.env.APIKEYOWM || "";
        let requestUrl = `${urlWeatherAPI}${city}&APPID=${APIKEYOWM}&units=${unit}&lang=${lang}`;
        // в запросе город может быть на русском языке, поэтому желательно экранировать URL чтобы избежать ошибок
        // error:  TypeError [ERR_UNESCAPED_CHARACTERS]: Request path contains unescaped characters
        // https://stackoverflow.com/questions/75980/when-are-you-supposed-to-use-escape-instead-of-encodeuri-encodeuricomponent
        let finalUrl = encodeURI(requestUrl);
        // console.log('requestUrl :', requestUrl);
        // console.log('finalUrl :', finalUrl);
        fetch(finalUrl)
            .then((response) => response.json())
            .then((response) => {
                // console.log('response :', response);
                if (response.cod === 200) {
                    let city_name = response.name;
                    let temp = response.main.temp;
                    let description = response.weather[0].description;
                    let grad = "\xB0"; // &deg; °
                    let message = `Сейчас в городе ${city_name} ${temp}${grad}C и ${description}.`;
                    // console.log('message :', message);
                    const opts = {
                        "reply_markup": {
                            keyboard: [
                                ["/menu"]
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    };
                    bot.sendMessage(chatId, message, opts);
                } else if (response.cod === 429) {
                    console.log('response 429 :', response);
                    // "Your account is temporary blocked due to exceeding of requests limitation of your subscription type. 
                    const opts = {
                        "reply_markup": {
                            keyboard: [
                                ["/menu"]
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    };
                    bot.sendMessage(chatId, "Извините сервис не доступен, попробуйте позже", opts);
                } else {
                    console.log('response else :', response);
                    let message = "Город не найден, попробуйте изменить регистр или язык ввода";
                    const opts = {
                        "reply_markup": {
                            keyboard: [
                                ["/menu"]
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    };
                    bot.sendMessage(chatId, message, opts);
                }
            })
            .catch((error) => console.log('error: ', error));


        bot.removeTextListener(regexp2);
    });

});

// https://core.telegram.org/bots/api#keyboardbutton
bot.onText(/Оставить контакты/, (msg) => {
    const opts = {
        reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            resize_keyboard: true,
            one_time_keyboard: true,
            keyboard: [
                [{ text: "Оставить свой телефон", request_contact: true }, { text: "Оставить своё местоположение", request_location: true }],
                ["/menu"]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, "Выберите вариант", opts);
});

bot.on("contact", (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);

    // можно взять контакты юзера и положить в базу например
    // можно взять сразу целый объект или отдельно по свойствам
    let user_info = msg.contact;
    // let phone = msg.contact.phone_number;
    console.log('user_info: ', user_info);


    const opts = {
        reply_to_message_id: msg.message_id
    };

    bot.sendMessage(chatId, "Спасибо за ваш телефон, ловите и наши контакты.", opts);

    let phoneNumber = "+7 987 654 32 11"
    let firstName = "Mr.Bot"
    bot.sendContact(chatId, phoneNumber, firstName, opts)
});

bot.on('location', (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);
    let location = msg.location;
    console.log("location: ", location);

    const opts = {
        reply_to_message_id: msg.message_id
    };
    bot.sendMessage(chatId, "Спасибо за ваше местоположение!", opts);
});

bot.on("sticker", (msg) => {
    const chatId = msg.chat.id;
    // console.log('msg :', msg);
    const opts = {
        reply_to_message_id: msg.message_id
    };
    // bot.sendMessage(chatId, "Я люблю стикеры!", opts);
    // bot.sendSticker(chatId, "CAADAgADMgoAAm4y2AAB_W-265DwO00C", opts); // отправляем конкретный стикер с конкретным id

    // или вот так, можно получить целый набор стикеров
    // bot.getStickerSet("ci_cat")
    //     .then(stickers => console.log('stickers :', stickers));


    // будем отправлять рендомный стикер из одного из указанных наборов
    // цепочка промисов нужна чтобы ответы шли один после другого, а не отправлялись как попало
    bot.sendMessage(chatId, "Я люблю стикеры!", opts)
        .then(_ => { // неважно что возвращается, нам просто нужно упорядочить ответы в telegram

            const stickerPacks = ["ci_cat", "GoodBoyResistance", "podslushano"]; // добавьте название любого стикерпака
            let stickerPack = stickerPacks[Math.floor(Math.random() * stickerPacks.length)];
            // console.log('stickerPack :', stickerPack);

            bot.getStickerSet(stickerPack)
                .then(stickersSet => {
                    // console.log('stickersSet :', stickersSet);
                    let stickers = stickersSet.stickers; // берём массив со стикерами
                    let packLength = stickers.length; // его длина
                    let stickerItem = stickers[Math.floor(Math.random() * packLength)]; // рендомный стикер-объект из этого массива
                    let stickerId = stickerItem.file_id; // его id-name
                    bot.sendSticker(chatId, stickerId);
                });
        });
});

// How to get the response of the keyboard selection or user input
// https://github.com/yagop/node-telegram-bot-api/issues/108#issuecomment-218765423
// https://github.com/yagop/node-telegram-bot-api/issues/356#issuecomment-311276792
// если вам не нужно будет удалять обработчик, то можно и не выносить регулярные выражения в переменную, как в примерах выше
const regexp1 = /^\/selectseries/;
bot.onText(regexp1, (msg, match) => {
    bot.sendMessage(msg.chat.id, "Select a serie", {
        "reply_markup": {
            "keyboard": [
                [{ text: "Да" }, { text: "Нет" }]
            ],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    });

    const regexp2 = /.+/; // важно!! сохранить regexp в переменную, чтобы была на него ссылка, по которой мы потом удалим обработчик
    bot.onText(regexp2, (msg, match) => {
        bot.sendMessage(msg.chat.id, "You selected " + match, {
            "reply_markup": {
                // "remove_keyboard": true // удалим предыдущее меню с выбором [Да-Нет] или просто вызовем новое меню
                keyboard: [
                    ["/menu"]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
        console.log('match :', match);
        bot.removeTextListener(regexp2); // удаляем обработчик
    });
});




bot.on('polling_error', (error) => {
    console.log("=== polling_error ===");
    console.log(error);
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

