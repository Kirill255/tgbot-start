require('dotenv').config();

const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');


const API = "https://api.telegram.org/bot";
const METHOD = "getUpdates"; // "getMe" https://core.telegram.org/bots/api#available-methods
const PROXY = process.env.PROXY || "http://118.174.211.219:3128"; // прокси бесплатные беру тут https://hidemyna.me/ru/proxy-list/?type=s#list  https://www.sslproxies.org/ , платные прокси можно вынести в конфиг
let TOKEN = process.env.TOKEN || "";

// https://core.telegram.org/bots/api#making-requests
const URL = `${API}${TOKEN}/${METHOD}`; // https://api.telegram.org/bot<token>/METHOD_NAME

// fetch(URL)
// 	// .then(res => res.json())
// 	.then(json => console.log(json))
// 	.catch(ex => console.log('Failed: ', ex));

// В России telegram заблокирован, поэтому нужно использовать proxy
fetch(URL, {
    agent: new HttpsProxyAgent(PROXY)
})
    .then(res => res.json())
    .then(res => console.log("Result: ", res.result))
    .catch(ex => console.log('Failed: ', ex));