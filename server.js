const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const app = express();
const bodyParser = require('body-parser');

const domain = process.env.DOMAIN;
const ownMail = process.env.EMAIL;
const ownMailPass = process.env.EPASSWORD;

const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const fs = require('fs');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const secretKey = 'gfdgr';
const interval = 24 * 60 * 60 * 1000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

async function generateAndSendLink() {
    try {
        // Генерация новой ссылки
        const expiration = Math.floor(Date.now() / 1000) + (60 * 60); // Текущее время + 24 часа
        //(24 * 60 * 60 * 1000)
        const token = jwt.sign({ exp: expiration }, secretKey);

        // Сохранение ссылки в базе данных
        await prisma.Token.create({
            data: {
                token,
                expiration: new Date(expiration)
            }
        });

        // Отправка ссылки на почту
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "partsa660@gmail.com",
                pass: "avjv kjgv qvra espq",
            },
        });
        const link = `${domain}/protected_page?token=${token}`;
        await transporter.sendMail({
            from: "ООО 'AutoParts' <partsa660@gmail.com>",
            to: "partsa660@gmail.com",
            subject: `Новая ссылка доступа`,
            html: `Ссылка на защищенную страницу: <a href="${link}">${link}</a>`
        });

        console.log('New link generated and sent:', link);
    } catch (error) {
        console.error('Error generating and sending link:', error);
    }
}

setInterval(generateAndSendLink, interval)

app.get('/generate-link', (req, res) => {
    const expiration = Math.floor(Date.now() / 1000) + (60 * 60); // Время в секундах
    const token = jwt.sign({ exp: expiration }, secretKey);

    const link = `${domain}protected_page?token=${token}`;

    res.send(link);
});


app.get('/protected_page', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(401).send('Access denied. Token missing.');
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.status(401).send('Access denied. Invalid token.');
        }

        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).send('Access denied. Token expired.');
        }

        try {
            const feedback = await prisma.FeedbackModel.findMany({
                orderBy: {
                    createdAt: 'desc',
                }
            });
            if (!feedback) {
                return res.status(404).send('Feedback not found.');
            }

            const feedbackTemplatePath = path.join(__dirname, 'public', 'feedback.ejs');

            const template = fs.readFileSync(feedbackTemplatePath, 'utf-8');

            const renderedHTML = ejs.render(template, { feedback });

            res.send(renderedHTML);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Internal server error.');
        }
    });
});

app.put('/update_status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedFeedback = await prisma.FeedbackModel.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        return res.json(updatedFeedback);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal server error.');
    }
});

app.post('/delete_feedback', async (req, res) => {
    const { id } = req.body;

    try {
        await prisma.FeedbackModel.delete({
            where: {
                id: parseInt(req.body.id)
            }
        });
        res.status(204).send(); // Успешный статус без содержимого (No Content)
    } catch (error) {
        console.error('Ошибка при удалении заявки:', error);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        if (!req.body || !req.body.name || !req.body.phone || !req.body.email) {
            return res.status(400).send('Invalid request. Missing required fields.');
        }
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: `${ownMail}`,
                pass: `${ownMailPass}`,
            },
        });
        const { name, phone, email } = req.body;
        const feedback = await prisma.feedbackModel.create({
            data: {
                name,
                phone,
                email,
            },
        });

        await transporter.sendMail({
            from: `ООО 'AutoParts' <${ownMail}>`,
            to: `${ownMail}`,
            subject: `Новая заявка`,
            text: email,
            html: `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Новая заявка</title>
          <style>
              * {
                  padding: 0;
                  margin: 0;
              }   
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
              }
              .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ccc;
              }
              h2 {
                  color: #007bff;
              }
              p{
                color: #000;
             }
             table {
              width: 300px; 
              border-collapse: collapse; 
               }
              td, th {
                  padding: 3px;
                  border: 1px solid black; 
              }
              th {
                  background: #b0e0e6;
              }
          </style>
      </head>
      <body>
           
          <div class="container">
              <h1>Новая заявка</h1>
          <table>
          <tbody>
              <tr>
                  <td>Имя:</td>
                  <td> ${name}</td>
              </tr>
              <tr>
                  <td>Телефон: </td>
                  <td> ${phone}</td>
              </tr>
              <tr>
                  <td> Почта: </td>
                  <td> ${email}</td>
              </tr>
          </tbody>
         </table>
          </div>
      </body>
      </html>
        `,

        });
        await transporter.sendMail({
            from: `ООО 'AutoParts' <${ownMail}>`,
            to: email,
            subject: `Вы оставили заявку`,
            text: email,
            html: `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ответ на вашу заявку</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
              }
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  border: 1px solid #ccc;
              }
              h2 {
                  color: #007bff;
              }
              p{
                color: #000;
             }
          </style>
      </head>
      <body>
          <div class="container">
            <h2>Вы оставили заявку</h2>
            <p>Здравствуйте, <strong> ${name}</strong>!</p>
            <p>Благодарим вас за обращение в нашу компанию. Мы получили вашу заявку и скоро свяжемся с вами.</p>
            <p>Ниже приведена информация о вашей заявке:</p>
            <ul>
                <li><strong>Имя:</strong> ${name}</li>
                <li><strong>Телефон:</strong> ${phone}}</li>
                <li><strong>Email:</strong> ${email}</li>
            </ul>
              <p>С уважением,<br>Команда AutoParts</p>
          </div>
      </body>
      </html> 
        `,
        })
        return res.status(200).json({ status: 200, message: "Success" });
    } catch (e) {
        console.error("Error:", e);
        return res
            .status(500)
            .send({ status: 500, message: "Internal server error" });
    }
});

app.listen(3000, () => {
    console.log('server start')
});