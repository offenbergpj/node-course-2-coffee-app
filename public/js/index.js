
$('#coffeegroup-name').focus(() => {
    console.log('focus');
    $.get("/groups", function (data) {
        var list = "";
        data.groups.forEach(function (group) {
            list += "<option value='" + group.group + "'>";
        });
        $('#coffeegroupList').html(list);
    });
});

jQuery('#login-form').on('submit', function (e) {
    e.preventDefault();

    var inputGroup = jQuery('[name=group]');
    var inputName = jQuery('[name=name]');

    console.log('group: ', inputGroup.val());
    console.log('name: ', inputName.val());
    var credentials = {
        'group': inputGroup.val(),
        'users': [{ 'name': inputName.val() }]
    }
    localStorage.setItem("credentials", JSON.stringify(credentials));

    $.ajax({
        url: '/groups',
        dataType: 'text',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(credentials),
        success: function (data, textStatus, jQxhr) {
            if (data) {
                console.log('result: ', data);
                window.location.href = '/home.html';
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
});
