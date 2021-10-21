/** Script qui gère toute la partie serveur **/

//Modules requis (socket.io, express)
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var mysql = require('mysql');
var passwordHash = require('password-hash');
var Timer  = require('easytimer.js').Timer;
const formatMessage = require('./fonctions/messages');
const {userJoin, getCurrentUser, getPersonnes, removeUser, getRoomUsers} = require('./fonctions/personnes');

let users = getPersonnes();
var timer = new Timer();

//Fichier contenant les donnees permettant de se connecter a la bdd
const dbconfig = require('./var');
var db_config = dbconfig.config();

var con;

function handleDisconnect() {
    // Recreate the connection, since the old one cannot be reused.
    con = mysql.createConnection(db_config);

    // The server is either down or restarting (takes a while sometimes).
    con.connect(function(err) {
        if(err) {
            console.log('error when connecting to db:', err);
            // We introduce a delay before attempting to reconnect, to avoid a hot loop, and to allow our node script to process asynchronous requests in the meantime.
            setTimeout(handleDisconnect, 2000);
        }
    });

    // If you're also serving http, display a 503 error.
    con.on('error', function(err) {
        console.log('db error', err);
        // Connection to the MySQL server is usually lost due to either server restart, or a
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        }
        // connnection idle timeout (the wait_timeout server variable configures this)
        else {
            throw err;
        }
    });
}

handleDisconnect();

app.use(express.static(__dirname + '/public'));

/** Partie réservée à l'API **/

app.use(express.json());

//Chargement des blind-tests depuis les dossiers
app.get('/list', function(req, res) {
    //Ouverture et récupération des infos du dossier
    fs.readdir('./public/resources', function(error, files) {
        if(error) {
            console.log("Erreur lors du chargement des blind-tests");
        }
        else {
            //Envoie des données au client
            res.send(files);
        }
    });
});

app.post('/load', function(req, res) {
    con.query("SELECT level FROM users WHERE username = '" + req.body['username'] + "'", function(err, result, fields) {
        if(err) throw err;
        var data = JSON.stringify({level: result[0].level});
        //Envoie des données au client
        res.send(data);
    });
});

//Récupération des infos transmises depuis le client à propos de la création de compte
app.post('/signin', function(req, res) {
    //Récupération de l'id de l'utilisateur
    con.query("SELECT id FROM users WHERE username = '" + req.body['username'] + "'", function(err, result, fields) {
        if(err) throw err;
        //Si l'id n'existe pas, donc que l'utilisateur n'existe pas
        if(result == "") {
            //Hashage du mot de passe
            var hashedPassword = passwordHash.generate(req.body['password']);
            //Insertion de l'utilisateur dans la base de données
            var insert = "INSERT INTO users (username, password, level) VALUES ('" + req.body['username'] + "',  '" + hashedPassword + "', + 0)";
            con.query(insert, function(err, result) {
                if(err) throw err;
                var data = JSON.stringify({result: "Success"});
                //Envoie des données au client
                res.send(data);
                console.log("Création de compte réussie !");
            });
        }
        //Sinon, l'utilisateur existe déjà
        else {
            var data = JSON.stringify({result: "Fail"});
            //Envoie des données au client
            res.send(data);
            console.log("Création de compte ratée !");
        }
    });
});

//Récupération des infos transmises depuis le client à propos de la connexion
app.post('/login', function(req, res) {
    //Récupération du mot de passe de l'utilisateur
    con.query("SELECT password FROM users WHERE username = '" + req.body['username'] + "'", function(err, result, fields) {
        if(err) throw err;
        //Si le mot de passe saisit correspond à celui de la base de données
        if(passwordHash.verify(req.body['password'], result[0].password)) {
            //Récupération du level de l'utilisateur
            con.query("SELECT level FROM users WHERE username = '" + req.body['username'] + "'", function(err, result, fields) {
                var data = JSON.stringify({result: "Success", level: result[0].level});
                //Envoie des données au client
                res.send(data)
                console.log("Connexion réussie !");
            });
        }
        //Sinon, les mots de passe ne correspondent pas
        else {
            var data = JSON.stringify({result: "Fail"});
            //Envoie des infos au client
            res.send(data);
            console.log("Connexion ratée ! ");
        }
    });
});

//Récupération des infos transmises depuis le client à propos du changement de mot de passe
app.post('/passChange', function(req, res) {
    //Récupération du mot de passe de l'utilisateur
    con.query("SELECT password FROM users WHERE username = '" + req.body['username'] + "'", function(err, result, fields) {
        if(err) throw err;
        //Si l'ancien mot de passe de l'utilisateur correspond à celui de la base de données
        if(passwordHash.verify(req.body['oldPass'], result[0].password)) {
            //Hashage du mot de passe
            var hashedPassword = passwordHash.generate(req.body['newPass']);
            //Mise à jour du mot de passe de l'utilisateur
            var sql = "UPDATE users SET password = '" + hashedPassword + "' WHERE username = '" + req.body['username'] + "'";
            con.query(sql, function(err, result) {
                var data = JSON.stringify({result: "Success"});
                //Envoie des données au client
                res.send(data);
                console.log("Changement de mot de passe réussi !");
            });
        }
        //Sinon, les mots de passe ne correspondent pas
        else {
            var data = JSON.stringify({result: "Fail"});
            //Envoie des infos au client
            res.send(data);
            console.log("Changement de mot de passe raté !");
        }
    });
});

//Fonction permettant de modifier le niveau d'un utilisateur
function updateLevel(listUsers) {
    for(let i = 0; i < listUsers.length; i ++) {
        con.query("SELECT level FROM users WHERE username = '" + listUsers[i].username + "'", function(err, result, fields) {
            if(err) throw err;
            if(result != "") {
                let level = result[0].level + listUsers[i].score;
                var sql = "UPDATE users SET level = '" + level + "' WHERE username = '" + listUsers[i].username + "'";
                con.query(sql, function(err, result) {
                    if(err) throw err;
                });
            }
        });
    }
}

/** Partie réservée aux websockets **/

//Lorsqu'un user est connecté...
io.on('connection', function(socket) {
    console.log('A user is connected !');

    //Lorsqu'un joueur se déconnecte
    socket.on('disconnect', () =>{
        console.log('A user disconnected !');
        removeUser(socket.id);
        io.emit('userLeft');
    });

    //Recherche des musiques du thème donné
    socket.on('rechercher', (themes) => {
        var fs = require('fs');
        var path = `./public/resources/${themes}/`;
        const user = getCurrentUser(socket.id);
        user.nbTour--;
        var listUsers = getRoomUsers(user.room);
        for(var i = 0 ; i < listUsers.length ; i++){
            listUsers[i].etat = 0;
        }

        fs.readdir("./public/resources/" + themes + "/", function(err, items) {
            var res = Math.floor(Math.random() * Math.floor(items.length));
            const user = getCurrentUser(socket.id);
            io.to(user.room).emit('playMusic', items[res]);
        });

        timerGame(socket,20,listUsers,themes);
    });

    //Interlude entre deux musiques
    socket.on('interlude', themes =>{
        timerPause(5,themes,socket);
    });

    //Ajout d'un joueur
    socket.on('upUsers', function(currentRoom) {
        users = getPersonnes();
        io.to(currentRoom).emit('getUsers', {
            room: currentRoom,
            users: users.filter(user => user.room === currentRoom)
        });
    });

    //Lorsqu'un joueur rejoint une partie
    socket.on('joinRoom', ({username, room}) => {
        let id = socket.id;
        let user;
        if(getRoomUsers(room).length === 0){
             user = userJoin(id, username, room, 2, 0, 0, 1);
             io.to(user.id).emit('showBtnPlay');
        }
        else{
            user = userJoin(id, username, room, 0, 0, 0, 0);
        }
        socket.join(user.room);
        users = getPersonnes();
        user = getCurrentUser(id);
        socket.broadcast.to(user.room).emit('message', formatMessage('Nigger', `${user.username} join the battle !`));
        io.to(user.room).emit('getUsers', {
            salle: user.room,
            users: users.filter(user => user.room === room)
        });
    });

    //Server recupere le message
    socket.on('chatMessage', (msg) =>{
        const user = getCurrentUser(socket.id);
        var res = user.etat;
        io.to(user.room).emit('message', formatMessage(user, msg, res));
    });

    //Server recupere la bonne reponse
    socket.on('chatMessageBonneReponse', (msg, score, scoreTemps) =>{
        const user = getCurrentUser(socket.id);
        if(user.etat < 3){
            if(user.etat !== score){
                if(score !== 3){
                    io.to(user.room).emit('messageReponse', formatMessage(user, msg, 0));
                    user.score += scoreTemps + 1;
                    user.etat += score;
                }
                else if((user.etat === 0) && (score === 3)){
                    io.to(user.room).emit('messageReponse', formatMessage(user, msg, 0));
                    user.score += scoreTemps + 1;
                    user.etat += score;
                }
            }
        }
    });

    //Permet de jouer la meme music a tous les participants
    socket.on('playMusic', music =>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('playMusic', music);
    });

    //Reset de la partie
    socket.on('reset', () =>{
        const user = getCurrentUser(socket.id);
        var listUsers = getRoomUsers(user.room);
        for(var i = 0 ; i < listUsers.length ; i++){
            listUsers[i].score = 0;
            listUsers[i].nbTour = 0;
        }
        listUsers[0].nbTour = 2;
    });

    //Affiche le bouton rejouer que au premier joueur
    socket.on('rejouer', () =>{
        const user = getCurrentUser(socket.id);
        var listUsers = getRoomUsers(user.room);
        io.to(listUsers[0].id).emit('rejouer');
    });

});

//Fonction qui gère le timer
function timerGame(socket, temps, listUsers, themes){
    const user = getCurrentUser(socket.id);
    var timer = new Timer();
    timer.start({countdown: true, startValues: {seconds: temps}});
    timer.addEventListener('secondsUpdated', function (e) {
        io.to(user.room).emit('setScore', timer.getTimeValues().seconds);
        if(timer.getTimeValues().seconds === 0){
            for(var i = 0 ; i < listUsers.length ; i++){
                listUsers[i].etat = 3;
            }
            if(user.room !== null){
                if(user.nbTour > 0){
                    io.to(user.room).emit('afficherResultatMusique');
                    io.to(user.id).emit('nextInterlude', themes);
                }
                else{
                    io.to(user.room).emit('finPartie', listUsers);
                    updateLevel(listUsers);
                }
            }
        }
        users = getPersonnes();
        io.to(user.room).emit('getUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });
    });
}

//Fonction qui met en pause le timer
function timerPause(temps,themes,socket){
    const user = getCurrentUser(socket.id);
    var timer = new Timer();
    timer.start({countdown: true, startValues: {seconds: temps}});
    timer.addEventListener('secondsUpdated', function (e) {
        io.to(user.room).emit('setScore', timer.getTimeValues().seconds);
        if(timer.getTimeValues().seconds === 0){
            io.to(user.room).emit('desactiverResultatMusique');
            io.to(user.id).emit('nextRound', themes);
        }
    });
}

//Port que le serveur va utiliser
http.listen(process.env.PORT || 1825, function() {
    console.log("Server running !");
});
