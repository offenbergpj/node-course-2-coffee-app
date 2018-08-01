var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CoffeeRoundSchema = new Schema({

    group: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    startedBy: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    status: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    startedAt: {
        type: Number,
        default: null
    },
    endedAt: {
        type: Number,
        required: false,
        default: null
    },
    users: [{
        name: String,
        order: [{
            name: String,
            extra: [{ type: String }]
        }]
    }]

});

var CoffeeRound = mongoose.model('CoffeeRound', CoffeeRoundSchema);
module.exports = { CoffeeRound };

