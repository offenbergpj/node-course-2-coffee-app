var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GroupSchema = new Schema({

    group: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    users: [{
        name: String
    }]

});

var Group = mongoose.model('Group', GroupSchema);
module.exports = { Group };