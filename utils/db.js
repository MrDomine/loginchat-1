//const mysql = require('mysql');
const {Client} = require('pg');

class Conexion {
    constructor() {
        this.con = new Client({
            user: "stwiovomovfdkc",
            host: "ec2-52-49-120-150.eu-west-1.compute.amazonaws.com",
            database:"daksclnbfta14d",
            password: "13b9d4a7eacb173ff10699a968bc5e42dfb4a4c820e2830568b3700328066b9a",
            port: 5432
        })

        this.con.connect();

        this.con.connect(function (err) {

            if (err) {
                this.con = null;
                console.log("Error al conectarme")
            } else {
                console.log("Connected!");
            }


        });
    }
}
module.exports = Conexion;