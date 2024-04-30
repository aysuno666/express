const express = require("express");
const app = express();

app.use('/', express.static('public'))
app.get("/", function(request, response){
     
    // отправляем ответ
    response.send("<h2>Привет Express!</h2>");
});
// начинаем прослушивать подключения на 3000 порту
app.listen(3000, ()=> {
    console.log('server start')
});