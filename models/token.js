const mongoose = require('mongoose')
const Schema = mongoose.Schema

//mongoose.set('useCreateIndex', true)

const tokenSchema = new Schema({
    _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: '525600m' }
});
const Token = mongoose.model('Token', tokenSchema)
module.exports = Token
