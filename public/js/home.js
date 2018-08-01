var socket = io();

var params = JSON.parse(localStorage.getItem('credentials'));

function scrollToBottom() {
    // Selectors
    var messages = jQuery('#messages');
    var newMessage = messages.children('li:last-child');
    // Heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
        messages.scrollTop(scrollHeight);
    }
}; 

$('#tableCoffeeOrder :checkbox').prop('checked', false);

$('#coffee').click(function () {
    if ($('#coffee').is(':checked')) {

        $('#tableCoffeeOrder :checkbox').prop('checked', false);
        $('#tableCoffeeOrder .waterHotColumn').addClass('hideColumn');
        $('#tableCoffeeOrder .waterColdColumn').addClass('hideColumn');
        $('#coffee').prop('checked', true);

        $('.coffeeMilkColumn').removeClass('hideColumn');
        $('.coffeeSugarColumn').removeClass('hideColumn');
    } else {
        $('.coffeeMilkColumn').addClass('hideColumn');
        $('.coffeeSugarColumn').addClass('hideColumn');
    }
});

$('#choco').click(function () {
    if ($('#choco').is(':checked')) {

        $('#tableCoffeeOrder :checkbox').prop('checked', false);
        $('#tableCoffeeOrder .coffeeMilkColumn').addClass('hideColumn');
        $('#tableCoffeeOrder .coffeeSugarColumn').addClass('hideColumn');
        $('#tableCoffeeOrder .waterHotColumn').addClass('hideColumn');
        $('#tableCoffeeOrder .waterColdColumn').addClass('hideColumn');
        $('#choco').prop('checked', true);

        $('.chocoColumn').removeClass('hideColumn');
    } else {
        $('.chocoColumn').addClass('hideColumn');
    }
});

$('#water').click(function () {
    if ($('#water').is(':checked')) {

        $('#tableCoffeeOrder :checkbox').prop('checked', false);
        $('#tableCoffeeOrder .coffeeMilkColumn').addClass('hideColumn');
        $('#tableCoffeeOrder .coffeeSugarColumn').addClass('hideColumn');
        $('#water').prop('checked', true);

        $('.waterHotColumn').removeClass('hideColumn');
        $('.waterColdColumn').removeClass('hideColumn');
    } else {
        $('.waterHotColumn').addClass('hideColumn');
        $('.waterColdColumn').addClass('hideColumn');
    }
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

function updateCoffeeRoundOrderList() {

    $.get("/startedRounds/" + params.group, function (data) {
        if (data) {
            var coffeeRound = data.coffeeround[0];
            socket.emit('updateCoffeeRound', coffeeRound, function (err) {
                if (err) {
                    alert(err);
                    window.location.href = '/home';
                } else {
                    console.log('No error');
                }
            });
        };
    });
};

function stopCoffeeRound(group, startedBy) {

    var stopInfo = {
        startedBy: startedBy,
        group: group,
    };

    $.ajax({
        url: '/stopCoffeeRound',
        dataType: 'text',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(stopInfo),
        success: function (data, textStatus, jQxhr) {
            if (data) {
                if (!$('#stopRound').prop('disabled')) {
                    $('#stopRound').prop('disabled', true);
                };
            };
        },
        error: function (jqXhr, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
};

socket.on('connect', function () {
    socket.emit('join', params, function (err) {

        if (err) {
            alert(err);
            window.location.href = '/';
        } else {
            document.title = `${capitalizeFirstLetter(params.group)} | CoffeeApp`;
            console.log('No error');
        }
    });
});

socket.on('disconnect', function () {
    console.log('Disconnected from server');
});

socket.on('updateUserList', function (users) {
    var ol = jQuery('<ol></ol>');

    users.forEach(function (user) {
        ol.append(jQuery('<li></li>').text(user));
    });
    jQuery('#users').html(ol);

});

socket.on('updateCoffeeRoundList', function (coffeeRound) {
    var formattedStartedAtTime = moment(coffeeRound.startedAt).format('h:m a');
    var formattedEndedAtTime = moment(coffeeRound.endedAt).format('h:m a');
    var template = jQuery('#orderlist-template').html();
    var html = Mustache.render(template, {
        startedBy: coffeeRound.startedBy,
        startedAt: formattedStartedAtTime,
        endedAt: formattedEndedAtTime
    });
    jQuery('#order-list-head').empty();
    jQuery('#order-list-head').append(html);

    var usersRes = coffeeRound.users;
    $("#tableCoffeeOrderList tr td").remove();
    usersRes.forEach(function (user) {
        var extra = user.order[0].extra[0] || "";
        $('#tableCoffeeOrderList tr:last').after('<tr><td>' + user.name + '</td><td>' + user.order[0].name + '</td><td>' + extra + '</td></tr>');
    });
});


socket.on('newMessage', function (message) {

    var formattedTime = moment(message.createdAt).format('h:m a');
    var template = jQuery('#message-template').html();
    var html = Mustache.render(template, {
        text: message.text,
        from: message.from,
        createdAt: formattedTime
    });
    jQuery('#messages').append(html);
    scrollToBottom();
});

jQuery('#message-form').on('submit', function (e) {
    e.preventDefault();

    var messageTextBox = jQuery('[name=message]');
    socket.emit('createMessage', {
        text: messageTextBox.val()
    }, function () {
        messageTextBox.val('')
    });
});

$('#stopRound').click(function (e) {
    e.preventDefault();
    stopCoffeeRound(params.group, params.users[0].name);
});

$('#checkRound').click(function (e) {
    e.preventDefault();

    $.get("/startedRounds/" + params.group, function (data) {

        if (data.coffeeround.length === 0) {

            if (!$('#stopRound').prop('disabled')) {
                $('#stopRound').prop('disabled', true);
            };
            if ($('#startRound').prop('disabled')) {
                $('#startRound').removeAttr('disabled');
            }
            if (!$('#joinRound').prop('disabled')) {
                $('#joinRound').prop('disabled', true);
            } 
        } else if (data.coffeeround.length > 0) {
            if (data.coffeeround[0].startedBy === params.users[0].name && data.coffeeround[0].status === 'started' && $('#stopRound').prop('disabled')) {
                $('#stopRound').removeAttr('disabled');
            };

            var currentUsers = data.coffeeround[0].users;
            var alreadyOrdered = currentUsers.filter(curuser => (curuser.name === params.users[0].name)).length > 0;
            if (alreadyOrdered) {
                jQuery('#requestOrder').addClass('hideOrders');
                jQuery('#showOrders').removeClass('hideOrders');
                updateCoffeeRoundOrderList();  
            } else {
                if ($('#joinRound').prop('disabled')) {
                    $('#joinRound').removeAttr('disabled');
                }
                if (!$('#startRound').prop('disabled')) {
                    $('#startRound').prop('disabled', true);
                }
            }
        } 
    });
});

var getOrderData = function () {
    var order = [];
    if ($('#coffee').prop('checked')) {
        var coffeeObj = {};
        coffeeObj['name'] = 'coffee'
        coffeeObj['extra'] = [];
        if ($('#coffeeMilk').prop('checked')) {
            coffeeObj.extra.push('milk');
        };
        if ($('#coffeeSugar').prop('checked')) {
            coffeeObj.extra.push('sugar');
        };
        order.push(coffeeObj);
    }
    if ($('#choco').prop('checked')) {
        var chocoObj = {};
        chocoObj['name'] = 'choco'
        chocoObj['extra'] = [];
        order.push(chocoObj);
    }
    if ($('#water').prop('checked')) {
        var waterObj = {};
        waterObj['name'] = 'water'
        waterObj['extra'] = [];
        if ($('#waterHot').prop('checked')) {
            waterObj.extra.push('Hot');
        };
        if ($('#waterCold').prop('checked')) {
            waterObj.extra.push('Cold');
        };
        order.push(waterObj);
    }
    return order;
};

$('#startRound').click(function (e) {
    e.preventDefault();

    $.get("/startedRounds/" + params.group, function (data) {
        if (data.coffeeround.length === 0) {
            var myOrder = getOrderData();
            var coffeeroundData = {
                group: params.group,
                startedBy: params.users[0].name,
                status: 'started',
                users: {
                    name: params.users[0].name,
                    order: myOrder
                }
            };
            
            $.ajax({
                url: '/startCoffeeRound',
                dataType: 'text',
                type: 'post',
                contentType: 'application/json',
                data: JSON.stringify(coffeeroundData),
                success: function (data, textStatus, jQxhr) {
                    if (data) {
                        var orderData = JSON.parse(data);
                        $('#startRound').prop('disabled', true);

                        var startedBy = orderData.startedBy;
                        var startedAt = orderData.startedAt;
                        var endedAt = orderData.endedAt;
                        socket.emit('createMessage', {
                            text: `${startedBy} started new Coffeeround @ ${moment(startedAt).format('llll')}`
                        }, function () {
                            socket.emit('createMessage', {
                                text: `The Coffeeround will end @ ${moment(endedAt).format('llll')}`
                            }, function () {
                                jQuery('#requestOrder').addClass('hideOrders');
                                jQuery('#showOrders').removeClass('hideOrders');
                                updateCoffeeRoundOrderList();  
                            })
                        });
                    };
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            });
        } else {
            if (!$('#startRound').prop('disabled')) {
                $('#startRound').prop('disabled', true);
            };
        };
    });
});

$('#joinRound').click(function (e) {
    e.preventDefault();

    $.get("/startedRounds/" + params.group, function (data) {
        if (data.coffeeround.length > 0) {
            var myOrder = getOrderData();
            var myUserOrder = {
                _id: data.coffeeround[0]._id,
                name: params.users[0].name,
                order: myOrder
            };

            $.ajax({
                url: '/joinCoffeeRound',
                dataType: 'text',
                type: 'post',
                contentType: 'application/json',
                data: JSON.stringify(myUserOrder),
                success: function (data, textStatus, jQxhr) {
                    if (data) {
                        var orderData = JSON.parse(data);
                        $('#joinRound').prop('disabled', true);

                        var joinTime = moment();
                        var startedBy = orderData.startedBy;
                        socket.emit('createMessage', {
                            text: `${myUserOrder.name} joined Coffeeround started by ${startedBy} @ ${joinTime.format('llll')}`
                        }, function () {
                            jQuery('#requestOrder').addClass('hideOrders');
                            jQuery('#showOrders').removeClass('hideOrders');
                            updateCoffeeRoundOrderList(); 
                        });

                    };
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    console.log(errorThrown);
                }
            });

        } else {
            console.log('No round started');
            if (!$('#joinRound').prop('disabled')) {
                $('#joinRound').prop('disabled', true);
            };
        };

    });
});

