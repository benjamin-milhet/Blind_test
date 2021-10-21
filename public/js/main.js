var currentUrl = window.location.href;
var url = new URL(currentUrl);
var audio = new Audio();

var room = url.searchParams.get("room");
var themes = url.searchParams.get("themes");

var musique;
var score = 0;

var couleur = "green";

//Fonction permettant de récupérer les cookies 
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

//Si l'url contient un utilisateur, ou si les cookies existent 
if(url.searchParams.has('username') || getCookie("username") != "") {
    
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.querySelector('.chat-messages');
    document.getElementById("chrono").style.display = "none";

    var btnPlay = document.getElementById('play');
    btnPlay.style.display = "none";
    
    document.getElementById("userInput").style.display = "none";

    var roomName = document.getElementById("room");
    
    var username = "";

    if(url.searchParams.has("username")) {
        username = url.searchParams.get("username");
    }
    else {
        username = getCookie("username");
    }

    var shareURL = currentUrl.split('?')[0];
    document.getElementById("share").value = shareURL + "?themes=" + themes + "&room=" + room;

    var usernames = document.getElementById("usernames");

    const socket = io();

    //Rejoindre une room
    socket.emit('joinRoom', {username, room});

    //Recupere le message depuis le server
    socket.on('message', message =>{
        if(message.etat < 3){
            outputMessage(message);
            //Scroll automatiquement
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }); 

    //Recupere le message d'une bonne reponse depuis le server
    socket.on('messageReponse', message =>{
            if(message.etat === 0){
                outputMessageInformation(message);
            //Scroll automatiquement
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }); 

    //Lance la musique
    btnPlay.addEventListener('click', () =>{
        if (themes !== null){
            btnPlay.style.display = "none";
            socket.emit('reset', '');
            socket.emit('rechercher', themes);
        }
    });

    //Afficher le bouton play au premier joueur
    socket.on('showBtnPlay', ()=>{
        btnPlay.style.display = "block";
    });

    //Envoi le message au server
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        //Recupere le message
        const msg = e.target.elements.msg.value;
        
        if(musique !== undefined){
            var verifMsg = verificationMessage(msg, musique);
            if (verifMsg === 1){
                socket.emit('chatMessageBonneReponse', ` a trouvé le nom de la musique`, 1, score);
            }
            else if (verifMsg === 2){
                socket.emit('chatMessageBonneReponse', ` a trouvé le nom du chanteur`, 2, score);
            }
            else if(verifMsg === 3){
                socket.emit('chatMessageBonneReponse', ` a trouvé le nom du chanteur et de la musique`, 3, score*2.5);
            }
            else{
                //Envoi le message au server
                socket.emit('chatMessage', msg);
            }
        }
        else{
            //Envoi le message au server
            socket.emit('chatMessage', msg);
        }
        
        //Efface le message de l'input
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();

    });

    //Récupération des utilisateurs
    socket.on('getUsers', ({salle, users}) => {
        while(usernames.firstChild) {
            usernames.removeChild(usernames.firstChild);
        }

        users.forEach(user => {
            let p = document.createElement('p');
            p.style.backgroundColor = "purple";
            p.style.color = "white";
            p.style.borderRadius = "30px";
            p.style.height = "6%";
            p.style.marginLeft = "2%";
            p.style.textAlign = "center";
            p.style.lineHeight = "225%";
            p.innerText = user.username + " : " + user.score;
            usernames.appendChild(p);
        });
    });
 
    //Si un utilisateur quitte la partie
    socket.on('userLeft', () => {
        socket.emit('upUsers', room);
    });

    //Lorsque l'on lance le jeu
    socket.on('playMusic', music => {
        this.disabledClassementFinal();
        audio.src = `../resources/${themes}/${music}`;
        audio.load();
        musique = music;
        audio.volume = 0.2;
        chrono();
        audio.play();
        
    });

    //Lors du lancement du round suivant
    socket.on('nextRound', themes => {
        document.getElementById("resultat-musique").style.display = "none";
        socket.emit('rechercher', themes);
    });

    //Lors du lancement de l'interlude suivant 
    socket.on('nextInterlude', themes => {
        outputResultatMusique(musique);
        socket.emit('interlude', themes);
    });

    //Lors de la fin d'une partie
    socket.on('finPartie', users =>{
        outputResultatMusique(musique);
        var listUsers = users;
        var resUsers = [];
        var res = triUsersScore(listUsers, resUsers);
        outputClassementFinal(res);
        socket.emit('rejouer');
    });

    //Permet de réafficher le bouton jouer
    socket.on('rejouer', () =>{
        this.afficherbtnPlay("Rejouer");
    });

    //Affichage du score
    socket.on('setScore', resScore =>{
        score = resScore;
        document.getElementById("base-timer-label").innerHTML = score;
    });

    //Affichage des résultats 
    socket.on('afficherResultatMusique', () =>{
        outputResultatMusique(musique);
    });

    //Cache les résultats
    socket.on('desactiverResultatMusique', () =>{
        document.getElementById("resultat-musique").style.display = "none";
    });
}
//Sinon
else {
    document.getElementById("game").style.filter = "blur(4px)";
    document.getElementById("shareDiv").style.filter = "blur(4px)";
    document.getElementById("userInput").style.display = "inline";
    document.getElementById("roomUser").value = room;
    document.getElementById("themesUser").value = themes;
}

//Permet d'afficher le message
function outputMessage(message){
    let div = document.createElement("div");
    div.className = "card";
    div.style.borderColor = "purple";
    div.style.borderWidth = "medium";
    div.style.marginBottom = "5px";
    let pHeader = document.createElement("p");
    pHeader.className = "card-header";
    pHeader.style.color = "purple";
    pHeader.innerText = message.username.username;
    let divBody = document.createElement("div");
    divBody.className = "card-body";
    let pBody = document.createElement("pBody");
    pBody.className = "card-text";
    pBody.innerText = message.texte;
    div.appendChild(pHeader);
    div.appendChild(divBody);
    divBody.appendChild(pBody);
    document.querySelector('.chat-messages').appendChild(div);
}

//Permet d'afficher un message d'information
function outputMessageInformation(message){
    let div = document.createElement("div");
    div.className = "card";
    div.style.borderColor = "purple";
    div.style.borderWidth = "medium";
    div.style.marginBottom = "5px";
    let divBody = document.createElement("div");
    divBody.className = "card-body";
    let pBody = document.createElement("pBody");
    pBody.className = "card-text";
    pBody.innerText = message.username.username + message.texte;
    div.appendChild(divBody);
    divBody.appendChild(pBody);
    document.querySelector('.chat-messages').appendChild(div);
}

//Fonction permettant de vérifier un message
function verificationMessage(message, musique){
    var res = 0;
    var mus = musique.split('.');
    mus = mus[0].split('!');
    //Pour le nom de la musique
    if(message.toLowerCase().sansAccent() === mus[0].toLowerCase().sansAccent()){
        res = 1;
    }
    //Pour le nom du chanteur
    else if(message.toLowerCase().sansAccent() === mus[1].toLowerCase().sansAccent()){
        res = 2;
    }
    else if(message.toLowerCase().sansAccent() === (mus[1].toLowerCase().sansAccent() + " " + mus[0].toLowerCase().sansAccent())){
        res = 3;
    }
    else if(message.toLowerCase().sansAccent() === (mus[0].toLowerCase().sansAccent() + " " + mus[1].toLowerCase().sansAccent())){
        res = 3;
    }
    return res;
}

//Permet d'afficher la bonne réponse après la fin du timer
function outputResultatMusique(musique){
    document.getElementById("resultat-musique").style.display = "block";
    const resultatMusique = document.getElementById('resultatMusique');
    if(musique !== undefined){
        var mus = musique.split('.');
        mus = mus[0].split('!');
        resultatMusique.innerText = `Artiste : ${mus[1]} / Chanson : ${mus[0]}`;
    }
}

//Permet d'afficher le classement final a la fin de la partie
function outputClassementFinal(resUsers){
    document.getElementById('scores-finals').style.display = "block";
    for(var i = 0 ; i < resUsers.length ; i++){
        var div = document.createElement('div');
        div.classList.add('score');
        div.innerHTML = `<p style="color: purple;" class = scoreView> ${i+1} : ${resUsers[i].username} (${resUsers[i].score}) </p>`;
        document.querySelector('.score').appendChild(div);
    }  
}

//Fonction qui permet de désactiver le classement final
function disabledClassementFinal(){
    document.getElementById("resultat-musique").style.display = "none";
    document.getElementById("scores-finals").style.display = "none";
}

//Permet de trier l'ordre des joueurs en fonction de leur classement
function triUsersScore(listUsers, resUsers){
    var res = listUsers[0];
    var valeur = 0;
    for(var i = 0 ; i < listUsers.length ; i++){
        if(res.score < listUsers[i].score){
            res = listUsers[i];
            valeur = i;
        }
    }
    listUsers.splice(valeur, 1);
    resUsers.push(res);
    if(listUsers.length > 0){
        triUsersScore(listUsers, resUsers);
    }
    return resUsers;
}

//Fonction permettant d'afficher le bouton play
function afficherbtnPlay(texte){
    btnPlay.style.display = "block";
    btnPlay.textContent = texte;

}

//Fonction qui gère le chronomètre 
function chrono(){
    document.getElementById("chrono").style.display = "block";
    document.getElementById("chrono").innerHTML = `
        <div class="base-timer">
        <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g class="base-timer__circle">
            <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45" />
            <path
        id="base-timer-path-remaining"
        stroke-dasharray="283"
        class="base-timer__path-remaining ${this.couleur}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
            </g>
        </svg>
        <span id="base-timer-label" class="base-timer__label">
        
        </span>
        </div>
        `;
}

//A ajouter dans index.js 
var btnCopier = document.getElementById('copy');
btnCopier.addEventListener('click', ()=>{
    var urlCopier = document.getElementById('share');
    var area_temp = document.createElement("input");
    area_temp.value = urlCopier.value;
    document.body.appendChild(area_temp);
    area_temp.select();
    if (document.execCommand('copy')){
        document.body.removeChild(area_temp);
    }
});

//Suppression des accents 
String.prototype.sansAccent = function(){
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    var noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];
    var str = this;
    for(var i = 0; i < accent.length; i++){
        str = str.replace(accent[i], noaccent[i]);
    }
    return str;
}