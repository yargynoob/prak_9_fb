const express = require('express');

const app = express();
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/user.html')
})

const PORT = 8100;


// Запуск сервера
app.listen(PORT, () => {
    console.log("Server is running on http://localhost:", PORT);
});


const WebSocket = require("ws");
const ws_server = new WebSocket.Server({port: 8082});

const clients = [];

ws_server.on("connection", onConnect);
function onConnect(client) {
    console.log("Connection opened");

    clients.push(client);

    // обрабатываем входящие сообщения от клиента
    client.on("message", function(data) {
        const clientData = JSON.parse(data);
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(clientData));
            }
        });
    });
    // закрытие подключения
    client.on("close", function() {
        const index = clients.indexOf(client);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });
}