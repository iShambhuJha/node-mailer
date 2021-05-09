const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
require("dotenv").config();

let email = process.env.EMAIL;
let password = process.env.PASSWORD;
const port = process.env.PORT || 3000;
// create express app
const app = express();

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// define a simple route
app.get('/notifyuser', (req, res) => {
    res.json({"message": "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes."});
    // sendemail();
});

// listen for requests
app.listen(port, () => {
    console.log("Server is listening on port 3000");
});

function sendemail(){
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  });
  
  var mailOptions = {
    from: 'info.mailer014@gmail.com',
    to: 'shambhu.jha014@gmail.com',
    subject: 'COVID-19 VACCINATION SLOT NOW AVAILABLE',
    text: 'That was easy!'
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}