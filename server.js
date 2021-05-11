const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const cron = require("node-cron");
require("dotenv").config();

let email = process.env.EMAIL;
let password = process.env.PASSWORD;
const port = process.env.PORT || 3000;

//run cron job
// cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });

// create express app
const app = express();

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// define a simple route
app.get("/notifyuser", (req, res) => {
  res.json({
    message:
      "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes.",
  });
  // sendemail();
  fetch(
    "https://covid-tracker-india-9e179-default-rtdb.firebaseio.com/users.json"
  )
    .then((res) => res.json())
    .then((json) => {
      console.log("First user in the array:");
      console.log(json);
      const params = { pincode: "827013", date: "11-05-2021" };
      const urlParams = new URLSearchParams(Object.entries(params));
      fetch(
        "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?" + urlParams,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36",
          },
        }
      )
        .then((res) => res.json())
        .then((json) => {console.log(json),
          sendemail()
        }
        );
    });
});

// listen for requests
app.listen(port, () => {
  console.log("Server is listening on port 3000");
});

function sendemail() {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });

  var mailOptions = {
    from: "info.mailer014@gmail.com",
    to: "shambhu.jha014@gmail.com",
    subject: "COVID-19 VACCINATION SLOT NOW AVAILABLE",
    text: "COVID-19 VACCINATION SLOT NOW AVAILABLE",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
