const path = require('path');
const http = require('http');
const _ = require('lodash');
const express = require('express');
const socketIO = require('socket.io');
var moment = require('moment');

const { generateMessage, generateLocationMessage } = require('./utils/message.js');
const { isRealString } = require('./utils/validation');
const { Users } = require('./utils/users.js');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

var { mongoose } = require('./db/mongoose.js');
var { Group } = require('./models/groups.js');
var { CoffeeRound } = require('./models/coffeeround.js');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(bodyParser.json());
app.use(express.static(publicPath, { index: 'index.html' }))

app.post('/groups', (req, res) => {

    var updateUser = {
        'name': req.body.users[0].name
    };

    Group.find({
        group: req.body.group
    }).then((groupFound) => {
        if (groupFound.length > 0) {
            Group.findOneAndUpdate(
                { group: req.body.group }, // find a document with that filter
                //group, // document to insert when nothing was found
                { $push: { 'users': updateUser }, safe: true, upsert: true }, // options
                function (err, doc) { // callback
                    if (err) {
                        // handle error
                        res.status(400).send(err);
                    } else {
                        // handle document
                        res.send(doc);
                    }
                }
            );
        } else {
            var group = new Group();
            group.group = req.body.group;
            group.users = [{ 'name': req.body.users[0].name }];

            group.save().then((doc) => {
                res.send(doc);
            }, (e) => {
                res.status(400).send(e);
            });
        }        
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/groups', (req, res) => {
    Group.find({}).then((groups) => {
        res.send({ groups });
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/startedRounds/:group', (req, res) => {

    var group = req.params.group;
    CoffeeRound.find({
        group: group,
        status: 'started'
    }).then((coffeeround) => {
        res.send({ coffeeround });
    }, (e) => {
        res.status(400).send(e);
    });
});

app.post('/stopCoffeeRound', (req, res) => {

    var stopTime = moment().valueOf();
    var body = _.pick(req.body, ['group', 'startedBy']);
    body['endedAt'] = stopTime;
    body['status'] = 'stopped';
    console.log('body: ', body);

    CoffeeRound.findOneAndUpdate({
            group: body.group,
            startedBy: body.startedBy,
            status: 'started'
        }, // find a document with that filter
        //group, // document to insert when nothing was found
        { $set: body }, { new: true }).then((coffeeRound) => {
            if (!coffeeRound) {
                return res.status(404).send();
            }

            res.send({ coffeeRound });
        }).catch((e) => {
            res.status(400).send();
        });
});

app.post('/startCoffeeRound', (req, res) => {

    var startTime = moment().valueOf();
    const durationInMinutes = '10';
    var endTime = moment(startTime).add(durationInMinutes, 'minutes');
    var endTimeEpoch = moment(endTime).valueOf();

    var coffeeRound = new CoffeeRound({
        group: req.body.group,
        startedBy: req.body.startedBy,
        status: 'started',
        startedAt: startTime,
        endedAt: endTimeEpoch,
        users: req.body.users
    });

    coffeeRound.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.post('/joinCoffeeRound', (req, res) => {
    console.log('req body: ', req.body);

    var updateOrder = {
        'name': req.body.name,
        'order': req.body.order
    };

    CoffeeRound.findOneAndUpdate(
        { _id: req.body._id }, // find a document with that filter
        //group, // document to insert when nothing was found
        { $push: { 'users': updateOrder }, safe: true, upsert: true }, // options
        function (err, doc) { // callback
            if (err) {
                // handle error
                res.status(400).send(err);
            } else {
                // handle document
                res.send(doc);
            }
        }
    );
});

server.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

io.on('connection', (socket) => {

    socket.on('join', (params, callback) => {
        params.group = params.group.toLowerCase();

        if (!isRealString(params.users[0].name) || !isRealString(params.group)) {
            return callback('Name and Group are required!');
        }

        if (users.isNameTaken(params.users[0].name, params.group)) {
            return callback('Name already taken.');
        }

        socket.join(params.group);
        users.removeUser(socket.id);
        users.addUser(socket.id, params.users[0].name, params.group);
        io.to(params.group).emit('updateUserList', users.getUserList(params.group));

        socket.emit('newMessage', generateMessage('Admin', 'Welcome to the Coffee app'));
        socket.broadcast.to(params.group).emit('newMessage', generateMessage('Admin', `${params.users[0].name} has joined.`));
        callback();
    });

    socket.on('createMessage', (message, callback) => {
        console.log('message received: ', message);
        var user = users.getUser(socket.id);
        console.log('user: ', user);
        if (user && isRealString(message.text)) {
            io.to(user.group).emit('newMessage', generateMessage(user.name, message.text));
        }

        callback();
    });

    socket.on('updateCoffeeRound', (coffeeRound, callback) => {
        var user = users.getUser(socket.id);
        io.to(user.group).emit('updateCoffeeRoundList', coffeeRound);
        callback();
    });


    socket.on('disconnect', () => {
        var user = users.removeUser(socket.id);

        if (user) {
            io.to(user.group).emit('updateUserList', users.getUserList(user.group));
            io.to(user.group).emit('newMessage', generateMessage('Admin', `${user.name} has left the group.`));
        }

    });

});



