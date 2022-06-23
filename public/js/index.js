var emojis = { ":-)": "0x1F600", ":-|": "0x1F604" };
const template_usuario = `<div class="row sideBar-body classUser">
<div class="col-sm-3 col-xs-3 sideBar-avatar">
  <div class="avatar-icon">
    <img src="{{img}}">
  </div>
</div>
<div class="col-sm-9 col-xs-9 sideBar-main">
  <div class="row">
    <div class="col-sm-8 col-xs-8 sideBar-name">
      <span class="name-meta nameUser">{{user}}
    </span>
    </div>
    <div class="col-sm-4 col-xs-4 pull-right sideBar-time">
      <span class="time-meta pull-right">{{hora_conexion}}
    </span>
    </div>
  </div>
</div>
</div>`;
const template_msg = `<div class="row message-body">
<div class="col-sm-12 message-main-{{origen}}">
    
    <div class="{{origen}}">
        <div class="avatar-icon">
            <img src="{{img}}">
        </div>
        <div class="message-text">
            {{msg}}
        </div>
        <span class="message-time pull-right">
            {{hora}}
        </span>
    </div>
</div>
</div>`;

const template_emoji = `<li><span class="dropdown-item emoji"></span></li>`;

window.onload = () => {
    let usuario = document.getElementById("usuario").innerText;
    let emojis = { ":-)": "0x1F600", ":-|": "0x1F604" };
    var socket = io();

    $(".dropdown-toggle").dropdown();

    var form = document.getElementById('form');
    var input = document.getElementById('input');
    /*
     var desconectar = document.getElementById("desconectar");
     desconectar.onclick = function salir() {
         socket.disconnect();
     }
     */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value) {
            socket.emit('chat', { from: usuario, message: input.value, imagen: $("#imgAvatar").attr("src") });
            input.value = '';
        }
    });
    socket.on('chat', function (msg) {
        let mensaje = msg.message;
        let sender = '';
        if (msg.from == usuario) {
            sender = 'sender';
        } else {
            sender = 'receiver';
        }

        let date = new Date();
        let hora = String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0");
        document.getElementById("conversation").innerHTML += template_msg.replace("{{msg}}", mensaje).replaceAll("{{origen}}", sender).replace("{{hora}}", hora).replace("{{img}}", msg.imagen);
        document.getElementById("conversation").scrollTo(0, document.getElementById("conversation").scrollHeight);
    });

    socket.on(usuario, (msg) => {
        alert(msg);
    })
    socket.on('usuarios', function (users) {

        let liUsuarios = "";
        for (const user of users) {
            if (user.nombre != usuario)
                liUsuarios += template_usuario.replace("{{user}}", user.nombre).replace("{{hora_conexion}}", user.hora).replace("{{img}}", `img/${user.imagen == null ? 'default' : user.imagen}.jpg`);
        }
        document.getElementById("usuarios").innerHTML = liUsuarios;
        let lis = document.getElementsByClassName("classUser");
        for (let index = 0; index < lis.length; index++) {
            const element = lis[index];
            element.onclick = (e) => {
                usuarioTo = e.currentTarget.innerText;
                message = prompt("type your message to " + usuarioTo);
                socket.emit('private_chat', {
                    to: usuarioTo,
                    message: message
                });
            }

        }
    })
    /*Received private messages*/
    socket.on('private_chat', function (data) {
        var username = data.username;
        var message = data.message;

        alert(username + ': ' + message);
    });
    socket.on("imagen", function (datos) {
        let imagenMostrar = document.getElementById("imagen");
        imagenMostrar.setAttribute("src", datos);
        console.log(datos)
    })


    input.onkeyup = () => {
        if (input.value.length >= 3) {
            if (emojis[input.value.substr(-3)] != undefined) {
                input.value = input.value.replace(input.value.substr(-3), String.fromCodePoint(emojis[input.value.substr(-3)]));

            }
        }
    }

    $("#searchText").keyup(function () {
        let nombres = $(".nameUser");
        let buscando = $(this).val();
        let item = "";
        for (let i = 0; i < nombres.length; i++) {
            item = $(nombres[i]).html().toLowerCase();

            if (buscando.length == 0 || item.indexOf(buscando) > -1) {
                $(nombres[i]).parents(".classUser").show();
            } else {
                $(nombres[i]).parents(".classUser").hide();
            }


        }
    })

    $(".reply-emojis").click(function () {
        let todoEmoji = "";
        for (const key in emojis) {
            if (Object.hasOwnProperty.call(emojis, key)) {
                todoEmoji += `<li><span class="dropdown-item emoji">${String.fromCodePoint(emojis[key])}</span></li>`;
            }
        }
        $(".listaEmojis").html(todoEmoji);
        $(".emoji").click(function (e) {
            $("#input").val($(e.currentTarget).text());
        })
    })
}