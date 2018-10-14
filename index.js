require('dotenv').config();

const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const qs = require('querystringify');

const API = "https://api.telegram.org/bot";
const PROXY = process.env.PROXY || "http://118.174.211.219:3128"; // прокси бесплатные беру тут https://hidemyna.me/ru/proxy-list/?type=s#list  https://www.sslproxies.org/ , платные прокси можно вынести в конфиг
let TOKEN = process.env.TOKEN || "";

// https://core.telegram.org/bots/api#making-requests 
// https://core.telegram.org/bots/api#available-methods
// https://api.telegram.org/bot<token>/METHOD_NAME

const BASE_URL = `${API}${TOKEN}/`; // https://api.telegram.org/bot<token>/
let url = "";
let getUpdatesOffset = 0; // id последнего присланного сообщения

const sendRequest = async (method, params = {}) => {

    url = `${BASE_URL}${method}`; // https://api.telegram.org/bot<token>/METHOD_NAME

    if (Object.keys(params).length) {
        let query = qs.stringify(params, true); // ?chat_id=id&text=text
        url = `${url}${query}`; // https://api.telegram.org/bot<token>/METHOD_NAME?chat_id=id&text=text
    }
    console.log('url :', url);

    try {
        const response = await fetch(url, { agent: new HttpsProxyAgent(PROXY) })
        const { result } = await response.json();
        // console.log("result1 :", result);

        if (result.length) {
            getUpdatesOffset = result[result.length - 1].update_id + 1; // id последнего присланного сообщения + 1, тоесть следующее новое сообщение, которое мы ещё не получали. Мы получили стопку сообщений, взяли id последнего из них, и дальше запрашиваем сообщения только начиная с послднего полученного в прошлый раз + 1 (тоесть начиная со следующего). Нам нужны только новые сообщения, старые мы уже получили
        }

        return result;
    } catch (error) {
        console.log("error: ", error);
    }
}

setInterval(() => {
    sendRequest("getUpdates", { "offset": getUpdatesOffset })
        .then(result => {
            // console.log("result2: ", result)
            result.forEach(item => {
                // console.log('item :', item);
                let chat_id = item.message.chat.id;
                sendRequest("sendMessage", { "chat_id": chat_id, "text": new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })
            });
        })
        .catch(ex => console.log(ex.message));
}, 10000);