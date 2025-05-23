const express = require('express');
const ejs = require('ejs');
const path = require('path');
const {v4:uuid4} = require('uuid');
const methodOverride = require('method-override');
const mysql = require('mysql2');
const session = require('express-session');
const nodemailer = require("nodemailer");
require("dotenv").config();
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('A user connected');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'flamekaiser',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000*60*60*24
    }
}));

const port = process.env.PORT || 8080;
server.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`);
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
    const q = `INSERT INTO message (msgSender, message) VALUES (?, ?)`;
    pool.query(q, [msg.sender, msg.content], (err, result) => {
        if (err) {
            console.error("Error inserting message:", err);
        } else {
            console.log("Message stored in DB with ID:", result.insertId);
        }
    });

    io.emit('chat message', msg); 
    console.log(msg.sender, msg.content);
});

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true
});

function generateOtp(length = 6) {
    const digits = "1234567890";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

const sendOTP = async (to, otp) => {
  try {
    const info = await transporter.sendMail({
      from: '"Chatroom Auth" <pacherwalvaibhav@gmail.com>',
      to,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    console.log("OTP sent:", info.messageId);
  } catch (error) {
    console.error("Failed to send OTP:", error.message);
  }
}

app.get('/', (req, res)=>{
    res.render('home');
});

app.get('/signup', (req, res)=>{
    res.render('signup');
});

app.post('/user', (req, res)=>{
    let id = uuid4();
    let {user, email, number, password} = req.body;
    let userDetails = [id, user, email, number, password];
    let q = `INSERT INTO user_details (id, name, email, mobile_number, password) VALUES (?, ?, ?, ?, ?)`;
    try {
        pool.query(q, userDetails, (err, result)=>{
            if(err) throw err;
            console.log(result);
            res.redirect('/');
        })
    } catch(err) {
        console.log(err);
    }
});

app.get('/login', (req, res)=>{
    res.render('login');
});

app.post('/user/log', (req, res)=>{
    let {user, password} = req.body;
    q = `SELECT * FROM user_details WHERE name = '${user}'`;
    try {
        pool.query(q, (err, result)=>{
            if(err) throw err;
            if(result.length === 0) {
                return res.send(`Oops! user not found!!`);
            }
            if(password != result[0].password) {
                return res.send(`invalid password!!`)
            } else {
                let user = result[0]
                let q1 = `SELECT * FROM message`;
                pool.query(q1, (err, messages)=>{
                    if(err) throw err;
                    res.render('chatroom', {user, messages});
                })
            }
        });
    } catch(err) {
        console.log(err);
    }
});

app.get('/mobile', (req, res)=>{
    res.render('mobile');
});

const otps = new Map();

app.post('/sent-otp', (req, res) => {
    let {email} = req.body;
    console.log(email);
    q = `SELECT * FROM user_details WHERE email = '${email}'`;
    try {
        pool.query(q, async (err, result)=>{
            if(err) throw err;
            if(result.length === 0) {
                res.send("user does not exist!!");
            } else {
                console.log(result);
                let otp = generateOtp();
                otps.set('email', otp);
                otps.set('username', result[0].name);
                await sendOTP(email, otp);
                res.render('otp')
            }
        })
    } catch(err) {
        console.log(err);
    }
});

app.post('/verified-user', (req, res)=>{
    let {enteredOtp} = req.body;
    let storedOtp = otps.get('email');
    let username = otps.get('username');
    if(storedOtp === enteredOtp) {
        let q = `SELECT * FROM user_details WHERE name = '${username}'`;
        try {
            pool.query(q, (err, result)=>{
                if(err) throw err;
                let user = result[0];
                let q1 = `SELECT * FROM message`;
                pool.query(q1, (err, messages)=>{
                    if(err) throw err;
                    res.render('chatroom', {user, messages});
                });
            })
        } catch(err) {
            console.log(err);
        }
    } else {
        res.send('invalid otp, try again!!!');
    }
});


