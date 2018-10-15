# tgbot-start

На данный момент бот на любое сообщение просто отправляет текущее время. 
Делал бота по этому [уроку](https://coursehunters.net/course/sozdaem-prostogo-bota-dlya-telegram-za-odin-chas), в уроке используется PHP, но впринципе всё понятно.

Переписал бота на node-telegram-bot-api и задеплоил на heroku, в коде использую системную переменную с heroku `HEROKU_APP_NAME` для того что бы она стала доступна, нужно сначала включить эксперементальный мод `heroku labs:enable runtime-dyno-metadata -a <app name>` [Подробнее](https://devcenter.heroku.com/articles/dyno-metadata). Также при деплое на хероку мне не нужен proxy
