const mongoose = require('mongoose')
var bcrypt = require('bcrypt')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: { 
        type: String, 
        unique: true 
    },
    
    roles: [{ 
        type: 'String' 
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    passwordResetToken: {
        type: String,
        required: false
    },
    passwordResetExpires: {
        type: Date,
        required: false
    },
   
    //token: String,
  //  Un champ qui permet l'expiration ici 
  // Il faut ajouter ceci dans server.js :
  // mongoose.set('useCreateIndex', true)

    createdAt:{
        type: Date,
        required: true,
        default: Date.now,
        expires: '525600m'
    },
    //validated: Boolean,
    //token: String,
    //un champ qui permet l'expiration
    //il  faut ajouter ceci dans server.js
    //mongoose.set ('useCreateIndex', true)
    modifiedAt: {
        type: Date,
        default: Date.now
    },

}, {collection: 'users'})

userSchema.methods.comparePassword = function (password, cb) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};

const User = mongoose.model('User', userSchema)
//mongoose.set('useCreateIndex', true)

module.exports = User
//module.exports = tokenSchema