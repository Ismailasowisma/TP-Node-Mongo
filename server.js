const express = require('express')
const app = express()
const helmet = require('helmet')
const bodyParser = require('body-parser')
const formParser = bodyParser.urlencoded({extended: false})
const mongoose = require('mongoose')
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

const { assert, check, validationResult } = require('express-validator');

// npm install --save express-session passport passport-local
const passport = require('passport')
const session = require('express-session')
const LocalStrategy = require('passport-local').Strategy

const port = 3000
mongoose.set('useCreateIndex', true)
mongoose.set('useFindAndModify', false)
mongoose.connect('mongodb+srv://ismaila:Da081090@cluster0-lmr7i.mongodb.net/cours', {useNewUrlParser: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'ERREUR MONGODB:'))
db.once('open', () => console.log('MONGODB EST CONNECTE'))

const User = require('./models/user')
const Token = require('./models/token')

app.use(helmet())
app.use(session({secret: 'une phrase très très secrete', resave: false, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user)
})
passport.deserializeUser((user, done) => {
    done(null, user)
})

passport.use(new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username }, (err, user) => {
            if (err) return done(err)
            if (!user) {
                return done(null, false, {
                    message: 'Utilisateur non trouvé'
                })
            }
            if (user.password !== password) {
                return done(null, false, {
                    message: 'Mauvais mot de passe'
                })
            }
            return done(null, user)
        })
    }
))

app.get('/signin', (req, res) => {
    res.render('signin.pug')
})
app.post('/login', formParser, (req, res) => {
    /*successRedirect: '/user',
    failureRedirect: '/signin'*/
    
    User.findOne({ username: req.body.username }, function(err, user) {
        if (!user) return res.status(401).send({ msg: 'This username ' + req.body.username + ' is not associated with any account. Double-check your username and try again.'});
 
            if (user.password !== req.body.password) {
                return done(null, false, {
                    message: 'Mauvais mot de passe'
                })
            }
            /*if (user.username == 'admin' && req.body.password == 'admin') {
                res.render('adminpage.pug')
            }*/
         
            //if (!isMatch) return res.status(401).send({ msg: 'Invalid username or password' });
 
            // Make sure the user has been verified
            if (!user.isVerified) return res.status(401).send({ type: 'not-verified', msg: 'Your account has not been verified.' }); 
 
            // Login successful, write token, and send back user
            //res.send({ token: generateToken(user), user: user.toJSON() });
            if (user.username == 'admin' && req.body.password == 'admin') {
                User.find({}).exec(function(err, users) {   
                    if (err) {
                        throw err
                    }
                    res.render('pageadmin.pug', { "users": users })
                })
            }
            else{
                res.render('welcome.pug')
            }
    });
});

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/signin')
})
app.get('/signup', (req, res) => {
    res.render('signup.pug')
})
app.post('/user', formParser, (req, res) => {
  /*req.assert('username', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('email', 'Email cannot be blank').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.sanitize('email').normalizeEmail({ remove_dots: false });*/
 
  // Check for validation errors    
  /*var errors = req.validationErrors();
  if (errors) { return res.status(400).send(errors); }*/
 
  // Make sure this account doesn't already exist
  User.findOne({ email: req.body.email }, function (err, user) {
    
    // Make sure user doesn't already exist
    if (user) return res.status(400).send({ msg: 'The email address you have entered is already associated with another account.' });
 
    // Create and save the user
    user = new User({ username: req.body.username, email: req.body.email, password: req.body.password });
    user.save(function (err) {
        if (err) {
            console.log(err)
            return res.status(500).send('erreur post/user')
        }
        res.status(201).send(`Utilisateur ${user._id} enregistré`)
        //console.log("token");
        //if (err) { return res.status(500).send({ msg: err.message }); }
 
        // Create a verification token for this user
        var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
        console.log("token", token);
        
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }
 
            
            /*var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: "imane2", pass: "ImaneImane++66" } });
            var mailOptions = { from: 'elmansouriimanee0gmail.com', to: user.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
            transporter.sendMail(mailOptions, function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send('A verification email has been sent to ' + user.email + '.');
            });*/
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'expressmailvalidation@gmail.com',
                  pass: 'nodeexpress'
                }
               });
          
              
              
              var mailOptions = {
                from: 'expressmailvalidation@gmail.com',
                to: user.email,
                text: `Veillez confirmer votre email en cliquant sur le lien suivant : http://localhost:3000/confirmation/${token.token}/${user.email}`,
                subject:'Mail de Confirmation'
              };
              
              transporter.sendMail(mailOptions, function (err, info) {
                if(err)
                  console.log(err)
                else
                  console.log(info);
             });

             transporter.close();
        });
    });
  });
})
app.get('/user/:_id', (req, res) => {
    const { _id } = req.params
    User.findById(_id, (err, user) => {
        if (err) return res.status(500).send('err')
        res.send(user)
    }).select('_id username modifiedAt')
})
app.get('/user', (req, res) => {
    if (!req.user) return res.redirect('/signin')
    User.find({}, (err, users) => {
        if (err) return res.status(500).send('err')
        res.send(users)
    }).select('_id username modifiedAt')
})
// curl http://localhost:3000/user/5d667c50fabd0026642dd0b3aze -X PUT -d 'username=vincent1016&password=qsd'
app.put('/user/:_id', formParser, (req, res) => {
    const { _id } = req.params
    const { username, password } = req.body
    User.findByIdAndUpdate(_id, { username, password }, (err, user) => {
        if (err) {
            // console.log('ERREUR: ', err)
            if (err.name === 'CastError') return res.status(404).send(`L’utilisateur ${_id} n’existe pas`)
            return res.status(500).send('err findByIdAndUpdate: ', err)
        }
        res.send(user)
    }).select('_id username modifiedAt')
})
// curl -X DELETE "http://localhost:3000/user/5d668e29b0159313942d68f2"
app.delete('/user/:_id', (req, res) => {
    const { _id } = req.params
    User.findByIdAndDelete(_id, (err, user) => {
        if (err) return res.status(500).send('findByIdeAndUpdate err:', err)
        if (!user) return res.status(404).send(`L’utilisateur ${_id} n’existe pas`)
        res.send(`L’utilisateur ${user._id} a été supprimé`)
    })
})

app.get(`/confirmation/:token/:email`, function(req, res){
    console.log("token", req.params.token);
     //this.confirmationPost
     Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

        // If we found a token, find a matching user
        User.findOne({ _id: token._userId, email: req.params.email }, function (err, user) {
            if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });

            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send("The account has been verified. Please log in.");
            });
        });
    });
});
app.post('/resend', function(req, res){
    this.resendTokenPost
});

/**
* POST /confirmation
*/
exports.confirmationPost = function (req, res, next) {
    /*req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.assert('token', 'Token cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    // Check for validation errors    
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);*/
    console.log("token2", req.params.token);

    // Find a matching token
    Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

        // If we found a token, find a matching user
        User.findOne({ _id: token._userId, email: req.params.email }, function (err, user) {
            if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });

            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send("The account has been verified. Please log in.");
            });
        });
    });
};

/**
* POST /resend
*/
exports.resendTokenPost = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    // Check for validation errors    
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);

    User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });

        // Create a verification token, save it, and send email
        var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Send the email
            var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
            var mailOptions = { from: 'no-reply@codemoto.io', to: user.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
            transporter.sendMail(mailOptions, function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send('A verification email has been sent to ' + user.email + '.');
            });
        });

    });
};

app.listen(port, () => console.log(`SERVEUR LANCE SUR LE PORT ${port}`))