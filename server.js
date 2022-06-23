const express = require('express')
const fs = require('fs');
const crypto = require('crypto')
const bodyparser = require("body-parser");
const Conexion = require("./utils/db");
session = require('express-session');
const app = express();
const fileUpload = require("express-fileupload");
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var moment = require('moment');

var usuarioOnline = [];
var users = {};
const sessionMiddleware = session({
    secret: '5577-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


app.use('/', express.static(__dirname + '/public'));

app.use(fileUpload());

app.get('/', function (req, res) {
    if (req.session && req.session.user) {
        fs.readFile(__dirname + "/index2.html", (err, data) => {
            data = data.toString().trim().replace("{{user}}", req.session.user.nombre).replace("{{img}}", `img/${req.session.user.imagen == null ? 'default' : req.session.user.imagen}.jpg`);
            res.send(data);
        })
    } else {
        res.sendFile(__dirname + "/public/views/login.html");
    }

})
app.get('/chat', function (req, res) {
    res.sendFile(__dirname + "/index2.html");
})

app.get('/registro', function (req, res) {
    res.sendFile(__dirname + "/public/views/registro2.html");
})

app.post("/", (req, res) => {
    let conexion = new Conexion();
    let pass = crypto.createHash('md5').update(req.body.password).digest("hex")

    let consulta = "select * from usuarios where username=$1 and password=$2";
    conexion.con.query(consulta, [req.body.username, pass], (error, results, fields) => {
        if (error) {
            fs.readFile("./public/views/login.html", (err, data) => {
                data = data.toString().trim().replace("##nombre##", "Login de Página").replace("##err##", error.message);
                res.send(data);
                return;
            })
        } else {
            if (results.rowCount > 0) {
                req.session.user = results.rows[0];
                usuarioOnline.push({ nombre: req.session.user.nombre, imagen: req.session.user.imagen, hora: moment().format('LT') });
                fs.readFile(__dirname + "/index2.html", (err, data) => {
                    data = data.toString().trim().replace("{{user}}", req.session.user.nombre).replace("{{img}}", `img/${req.session.user.imagen == null ? 'default' : req.session.user.imagen}.jpg`);
                    res.send(data);
                })
            } else {
                fs.readFile("./public/views/login.html", (err, data) => {
                    data = data.toString().trim().replace("##nombre##", "Login de Página").replace("##err##", "Usuario o contraseña incorrecto");
                    res.send(data);
                    return;
                })
            }
        }
        conexion.con.end();
    });
})

app.post("/registro", (req, res) => {
    let conexion = new Conexion();
    let pass = crypto.createHash('md5').update(req.body.password).digest("hex");
    let EDFile = req.files.perfil;
    EDFile.name = req.body.username;


    let registro = "INSERT INTO usuarios (username, password, imagen, nombre) VALUES ($1, $2, $3, $4)";
    conexion.con.query(registro, [req.body.username, pass, EDFile.name, req.body.nombre], (error, results) => {
        if (error) {
            fs.readFile("./public/views/registro2.html", (err, data) => {
                data = data.toString().trim().replace("##err##", error.message);
                res.send(data);
                return;
            })
        } else {
            if (results.rowCount > 0) {
                res.redirect("/");
            } else {
                fs.readFile("./public/views/registro2.html", (err, data) => {
                    data = data.toString().trim().replace("##err##", error.message);
                    res.send(data);
                    return;
                })
            }

            EDFile.mv(`./public/img/${EDFile.name}.jpg`, err => {
                if (err) return res.status(500).send({ message: err })
            })
        }
    })
    conexion.con.end();
})

app.get("/desconectar", (req, res) => {
    let imagen = req.session.user.imagen+".jpg";
    if (imagen == null) {
        imagen = "default.jpg";
    }
    for (let i = 0; i < usuarioOnline.length; i++) {
        if (usuarioOnline[i].nombre == req.session.user.nombre) {
            usuarioOnline.splice(i, 1);
        }
    }
    io.emit("chat", { from: req.session.user.nombre, message: " ha abandonado el chat.", imagen: "img/"+imagen });
    io.emit("usuarios", usuarioOnline);
    req.session.destroy();
    res.redirect("/");
})


// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

// only allow authenticated users
io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.user) {
        next();
    } else {
        next(new Error("unauthorized"));
    }
});

io.on('connection', (socket) => {

    io.emit("usuarios", usuarioOnline);
    //socket.broadcast.emit("chat","nuevo usuario desde io")
    console.log(socket.request.session.user.nombre + ' connected ');
    let user = socket.request.session.user.nombre;

    users[user] = socket.id;
    console.log(users);
    socket.on('chat', (msg) => {
        //let mensaje = socket.request.session.user.nombre + ":" + msg;
        io.emit('chat', msg);
    });

    /*Private chat*/
    socket.on('private_chat', function (data) {
        const to = data.to,
            message = data.message;

        if (users.hasOwnProperty(to)) {
            io.to(users[to]).emit('private_chat', {
                //The sender's username
                username: socket.request.session.user.nombre,
                //Message sent to receiver
                message: message
            });
        }

    });

    socket.on("radio",(blob)=>{
        //socket.broadcast.emit("chat",{ from: socket.request.session.user.nombre, message: "Nuevo audio", imagen: `img/${socket.request.session.user.imagen}` })
        socket.broadcast.emit("radio",blob)
        console.log("emitiendo audio desde el servidor")
    })

    socket.on("disconnect", (reason) => {
        console.log(reason);
        let mensaje = socket.request.session.user.nombre + ": " + reason
        let usuario = socket.request.session.user.nombre;
        let imagen = socket.request.session.user.imagen;
        for (let i = 0; i < usuarioOnline.length; i++) {
            if (usuarioOnline[i].nombre == usuario) {
                usuarioOnline.splice(i, 1);
            }
        }

        
    });


});

function base64_encode(file) {
    return "data:image/jpg;base64," + fs.readFileSync(file, 'base64');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, (err) => {
    console.log(`Servidor iniciado en ${PORT}`);
});