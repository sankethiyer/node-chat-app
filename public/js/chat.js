var socket = io();

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    var scrollHeight = $(document).height();
    var scrollPosition = $('#messages').height() + $(window).scrollTop();

    if ($(window).scrollTop() + $(window).height() == $(document).height()) {
        $("html, body").animate({ scrollTop: $(document).height() }, 1000);
    }
}


socket.on('message', (message) => {
    console.log(message);

    var template = $('#message-template').html();
    var rendered = Mustache.render(template, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm:ss a")
    });
    $('#messages').append(rendered)
    autoScroll()
});

socket.on('locationMessage', (message) => {
    console.log(message);
    var template = $('#location-message-template').html();
    var rendered = Mustache.render(template, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm:ss a")
    });
    $('#messages').append(rendered)
    autoScroll()
});

socket.on('roomData', ({ room, users }) => {
    console.log(room);
    console.log(users);
    var template = $('#side-template').html();
    var rendered = Mustache.render(template, {
        room,
        users
    });
    $('.chat__sidebar').html(rendered)

});

$(document).ready(function () {
    var formInput = $('#m')

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('sendMessage', formInput.val(), (err) => {
            if (err) {
                return console.log(err);
            }
            console.log('Msg was delivered');
        });
        formInput.val('');
        formInput.focus()
        return false;
    });

    $('#send-location').on('click', function () {
        if (!navigator.geolocation) {
            return 'Geolocation is not supported by your browser';
        }
        $(this).attr('disabled', 'disabled')

        navigator.geolocation.getCurrentPosition((position) => {
            console.log(position);
            socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, () => {
                console.log('Location shared');
                $(this).removeAttr('disabled')
            })
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})
