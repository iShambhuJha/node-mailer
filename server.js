require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const cron = require("node-cron");
const hbs = require("nodemailer-express-handlebars");
const path = require('path');
const mongoose = require("mongoose");
var Schema = mongoose.Schema;
var mn="shambhu"
//Connect to mongoDB
const URI = process.env.URI;
mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected");
  })
  .catch("failed");

//Schema
var schemaName = new Schema(
  {
    name: String,
    age: Number,
    email: String,
    pin: String,
  },
  {
    collection: "users",
  }
);
var allUsers = [];
var Model = mongoose.model("Model", schemaName);

let email = process.env.EMAIL;
let password = process.env.PASSWORD;
const port = process.env.PORT || 3000;

//run cron job
cron.schedule('* * * * *', () => {
    // sendemail();
    fetch("https://notify-nodemailer.herokuapp.com/getUsers")
    .then((res) => res.json())
    .then((json) => {
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");
      var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      var yyyy = today.getFullYear();

      today = dd + "-" + mm + "-" + yyyy;
      allUsers = json;
      allUsers.forEach(element => {
          const params = { pincode: element.pin, date: today };
          const urlParams = new URLSearchParams(Object.entries(params));
           fetch(
            "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?" +
              urlParams,
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
            .then((data) => {
              var centers = [];
              var avlblSlots = [];
              var avlbCenters = [];
  
              centers = data.centers;
              if(centers.length>0){
              loop2: for (var j = 0; j < centers.length; j++) {
                loop3: for (var k = 0; k < centers[j].sessions.length; k++) {
                  if (
                    centers[j].sessions[k].min_age_limit == element.age &&
                    centers[j].sessions[k].available_capacity > 0
                  ) {
                    avlbCenters.push(centers[j]);
                    // avlblSlots.push(centers[j].sessions[k]);
                  }
                  if (j == centers.length-1) {
  
                    for(var c=0;c<avlbCenters.length;c++){
                      var totalAvlbl;
                      totalAvlbl=0;
                      for(var a=0;a<avlbCenters[c].sessions.length;a++){
                        totalAvlbl += avlbCenters[c].sessions[a].available_capacity;
                        avlbCenters[c]["totalVaccine"] = totalAvlbl;
                      }
  
                    }
  
                    sendemail(avlbCenters,element.email,element.name);
                  }
                }
              }
            }
            })
      }); 
    });
});

// create express app
const app = express();

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type,Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  next();
});

app.post("/addUser", (req, res, next) => {
  const post = new Model({
    name: req.body.name,
    age: req.body.age,
    email: req.body.email,
    pin: req.body.pin,
  });
  post.save().then((result) => {
    res.status(200).json({
      message: "success: added user",
    });
  });
});

app.get("/getUsers", function (req, res) {
  Model.find({}, function (err, result) {
    if (err) throw err;
    if (result) {
      res.json(result);
    } else {
      res.send(
        JSON.stringify({
          error: "Error",
        })
      );
    }
  });
});

// define a simple route
app.get("/notifyuser", (req, res) => {
  res.json({
    message:
      "Welcome to EasyNotes application. Take notes quickly. Organize and keep track of all your notes.",
  });

});


// listen for requests
app.listen(port, () => {
  console.log("Server is listening on port 3000");
});

function sendemail(slots,userEmailId,userName) {
  console.log(userEmailId)
  let ids = slots.map((o) => o.center_id);
  let filtered = slots.filter(
    ({ center_id }, index) => !ids.includes(center_id, index + 1)
  );
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
  const handlebarOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve(__dirname, "views"),
      defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, "views"),
    extName: ".handlebars",
  };
  transporter.use(
    "compile",
    hbs(handlebarOptions)
  );

  var mailOptions = {
    from: "info.mailer014@gmail.com",
    to: userEmailId,
    subject: "COVID-19 VACCINATION SLOT NOW AVAILABLE",
    text:"hi",
    template:'index',
    context: {
      slotsData: filtered,
      name:userName
  }
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
