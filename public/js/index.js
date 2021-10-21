/** Script qui gère toutes les actions de la page index.html **/

//letiables liées aux éléments de la page html
let room = document.getElementById("room");
let list = document.getElementById("list");
let account = document.getElementById("account"); 
let retype = document.getElementById("retype");
let user = document.getElementById("user");
let password = document.getElementById("password");
let profil = document.getElementById("profil");
let logorsign = document.getElementById("logorsign");
let pseudo = document.getElementById("pseudo");
let level = document.getElementById("level");
let oldPass = document.getElementById("oldPass");
let newPass = document.getElementById("newPass");
let newPassRepeat = document.getElementById("newPassRepeat");
let modif = document.getElementById("modif");
let passSecur = document.getElementById("passSecur");
let loginModal = document.getElementById("loginModal");
let nav = document.getElementById("nav");
let passwordRepeat = document.getElementById("passwordRepeat");
let info = document.getElementById("info");

//Fonction permettant de détecter si le caractère fourni est un chiffre ou non
function isNumeric(value) {
    return /^-{0,1}\d+$/.test(value);
}

//Fonction équivalente à htmlspecialchars en php
function htmlspecialchars(str) {

    //Remplacement de tous les caractères
    if (typeof(str) == "string") {
        str = str.replace(/&/g, "&amp;");
        str = str.replace(/"/g, "&quot;");
        str = str.replace(/'/g, "&#039;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/>/g, "&gt;");
    }

    //Renvoie de la chaine sécurisée
    return str;
}

//Fonction permettant de créer des cookies 
function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

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

//Function qui charge les cookies 
function load() {
    list.style.filter = "blur(4px)";
    nav.style.filter = "blur(4px)";

    //Envoie des données de chargement des blind-tests au serveur 
    fetch("/list")
        //Récupération de la réponse
        .then((data) => {
            data.json().then(function(files) {
                for(let i = 0; i < files.length; i ++) {
                    //Création des éléments 
                    let col = document.createElement("div");
                    col.className = "col";
                    let card = document.createElement("div");
                    card.className = "card bg-dark text-white";
                    let cardImg = document.createElement("div");
                    cardImg.className = "card-image";
                    let cardBody = document.createElement("div");
                    cardBody.className = "card-body";
                    let h5 = document.createElement("h5");
                    h5.className = "card-title";
                    h5.style.textAlign = "center";
                    h5.innerText = files[i];
                    let img = document.createElement("img");
                    img.src = "../images/" + files[i] + "/" + files[i] + ".jpg";
                    img.className = "card-img-top";
                    let imgOverlay = document.createElement("div");
                    imgOverlay.className = "image-overlay";
                    let p = document.createElement("p");
                    p.style.textAlign = "center";
                    p.style.marginTop = "14%";
                    let form = document.createElement("form");
                    form.action = "game.html";
                    let label = document.createElement("label");
                    label.className = "form-label";
                    let inputThemes = document.createElement("input");
                    inputThemes.type = "hidden";
                    inputThemes.id = "themes";
                    inputThemes.name = "themes";
                    inputThemes.value = files[i];
                    let inputText = document.createElement("input");
                    inputText.name = "username";
                    inputText.id = "username";
                    inputText.className = "form-control";
                    inputText.style.width = "50%";
                    inputText.style.marginLeft = "25%";
                    inputText.type = "text";
                    inputText.required = true;
                    if(getCookie("username") !== "") {
                        inputText.value = getCookie("username");
                    }
                    else {
                        inputText.placeholder = "Entrez un pseudo...";
                    }
                    let br = document.createElement("br");
                    let button = document.createElement("button");
                    button.type = "submit";
                    button.className = "btn text-light";
                    button.style.backgroundColor = "purple";
                    button.innerText = "Créer une partie";
                    let inputRoom = document.createElement("input");
                    inputRoom.type = "hidden";
                    inputRoom.name = "room";
                    inputRoom.id = "room";
                    inputRoom.value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    //Ajout des éléments dans la page
                    list.appendChild(col);
                    col.appendChild(card);
                    card.appendChild(cardImg);
                    card.appendChild(cardBody);
                    cardImg.appendChild(img);
                    cardImg.appendChild(imgOverlay);
                    imgOverlay.appendChild(p);
                    p.appendChild(form);
                    form.appendChild(label);
                    form.appendChild(inputThemes);
                    form.appendChild(inputText);
                    form.appendChild(br);
                    form.appendChild(inputRoom);
                    form.appendChild(button);
                    cardBody.appendChild(h5);
                }
            })
        })
        
    //Vérification de l'existence des cookies 
    if(getCookie("username") != "") {
        nav.style.filter = "blur(0px)";
        list.style.filter = "blur(0px)";
        profil.style.display = "inline";
        account.style.display = "none";
        logorsign.style.display = "none";

        fetch("/load", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: getCookie("username")})
        })
        .then(function(res){ return res.json(); })
        //Récupération de la réponse
        .then(function(data){
            setCookie("level", data.level, 365);
            pseudo.innerText = getCookie("username");
            realLevel = getCookie("level").substr(0, (getCookie("level").length-2));
            if(realLevel == "") {
                realLevel = "0";
            }
            level.innerText = "Level : " + realLevel;
            document.getElementById("progressBar").style.width = getCookie("level").substr(getCookie("level").length-2, getCookie("level").length) + "%";
        })
    }
    else {
        $('#cookies').modal("show");
    }
}

//Fonction qui affiche le formulaire de connexion
function login() {
    list.style.filter = "blur(4px)";
    nav.style.filter = "blur(4px)";
    user.value = "";
    password.value = "";
    loginModal.innerText = "Connexion";
    account.style.display = "inline";
    passwordRepeat.style.display = "none";
    passSecur.style.display = "none";
}

//Fonction qui affiche le formulaire de création de compte
function signin() {
    list.style.filter = "blur(4px)";
    nav.style.filter = "blur(4px)";
    user.value = "";
    password.value = "";
    loginModal.innerText = "Créer un compte";
    account.style.display = "inline";
    passwordRepeat.style.display = "inline";
    passSecur.style.display = "inline";
}

//Function qui rétabli le flou de la page d'accueil
function modalConnect() {
    info.style.display = "none";
    list.style.filter = "blur(0px)";
    nav.style.filter = "blur(0px)";
}

//Fonction permettant de se connecter 
function connect() {
    let nbInt = 0; 

    //Si les champs ne sont pas vides 
    if(user.value !== "" && password.value !== "") {
        //Si c'est une création de compte
        if(passwordRepeat.style.display === "inline") {
            let passSize = htmlspecialchars(password.value) + "";
            //Si le mot de passe fait plus de 4 caractères
            if(passSize.length > 3) {
                let haveInt = passSize.split("");
                //Pour tous les caractères du mot de passe 
                for(let i = 0; i < haveInt.length; i ++) {
                    //Si le caractère est un chiffre on incrémente nb de 1
                    if(isNumeric(haveInt[i])) {
                        nbInt++;
                    }
                }
                //Si nb est positif donc s'il y a au moins 1 chiffre
                if(nbInt > 0) {
                    //Si les mots de passe correspondent 
                    if(htmlspecialchars(retype.value) === htmlspecialchars(password.value)) {

                        //Envoie des données de création de compte au serveur 
                        fetch("/signin", {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({username: htmlspecialchars(user.value), password: htmlspecialchars(password.value)})
                        })
                        .then(function(res){ return res.json(); })
                        //Récupération de la réponse
                        .then(function(data){
                            if(data.result === "Success") {
                                //Affichage d'un message de réussite de connexion
                                info.style.display = "none";
                                nav.style.filter = "blur(0px)";
                                list.style.filter = "blur(0px)";
                                profil.style.display = "inline";
                                logorsign.style.display = "none";
                                pseudo.innerText = user.value;
                                level.innerText = "Level : 0";
                                $("#account").modal("hide");
                                //Création des cookies 
                                setCookie("username", user.value, 365);
                                setCookie("level", "0", 365);
                            }
                            //Sinon affichage d'un message d'erreur 
                            else if(data.result === "Fail") {
                                info.style.display = "inline";
                                info.innerText = "Pseudo occupé";
                            }
                        })
                    }
                    //Sinon affichage d'un message d'erreur 
                    else {
                        info.style.display = "inline";
                        info.innerText = "Mots de passe différents";
                    }
                }
                //Sinon affichage d'un message d'erreur 
                else {
                    info.style.display = "inline";
                    info.innerText = "Manque de chiffre";
                }
            }
            //Sinon affichage d'un message d'erreur 
            else {
                info.style.display = "inline";
                info.innerText = "Trop court";
            }
        }
        //Si c'est juste une connexion
        else {  
            //Enooie des données de connexion au serveur 
            fetch("/login", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({username: htmlspecialchars(user.value), password: htmlspecialchars(password.value)})
            })
            .then(function(res){ return res.json(); })
            //Récupération de la réponse
            .then(function(data){
                if(data.result == "Success") {
                    //Affichage d'un message de réussite de connexion
                    info.style.display = "none";
                    nav.style.filter = "blur(0px)";
                    list.style.filter = "blur(0px)";
                    profil.style.display = "inline";
                    logorsign.style.display = "none";
                    pseudo.innerText = user.value;
                    realLevel = getCookie("level").substr(0, (getCookie("level").length-2));
                    if(realLevel == "") {
                        realLevel = "0";
                    }
                    level.innerText = "Level : " + realLevel;
                    document.getElementById("progressBar").style.width = getCookie("level").substr(getCookie("level").length-2, getCookie("level").length) + "%";
                    $('#account').modal('hide');
                    //Création des cookies 
                    setCookie("username", user.value, 365);
                    setCookie("level", data.level, 365);
                } 
                //Sinon affichage d'un message d'erreur 
                else if(data.result == "Fail") {
                    info.style.display = "inline";
                    info.innerText = "Mauvaises informations";
                }
            })
        }
    }
}

//Fonction qui permet de déconnecter un utilisateur et de supprimer les cookies 
function disconnect() {
    profil.style.display = "none";
    logorsign.style.display = "inline";

    //Suppression des cookies 
    document.cookie = "username=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie = "level=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

//Fonction permettant d'afficher le formulaire de changement de mot de passe
function passwordChange() {
    oldPass.value = "";
    newPass.value = "";
    newPassRepeat.value = "";
    nav.style.filter = "blur(4px)";
    list.style.filter = "blur(4px)";
    modif.style.display = "inline";
}

//Fonction permettant de changer le mot de passe
function changePass() {
    let nbInt = 0; 

    //Si les champs ne sont pas vides 
    if(oldPass.value !== "" && newPass.value !== "" && newPassRepeat.value !== "") {
        let passSize = htmlspecialchars(newPass.value) + "";
        //Si le mot de passe fait plus de 4 caractères
        if(passSize.length > 3) {
            haveInt = passSize.split('');
            //Pour tous les caractères du mot de passe 
            for(i = 0; i < haveInt.length; i ++) {
                //Si le caractère est un chiffre, on incrémente nb de 1
                if(isNumeric(haveInt[i])) {
                    nbInt++;
                }
            }
            //Si nb est positif alors le mot de passe contient au moins 1 mot de passe
            if(nbInt > 0) {
                //Si les deux nouveaux mots de passe correspondent 
                if(htmlspecialchars(newPass.value) === htmlspecialchars(newPassRepeat.value)) {
                    //Envoie des données de changement de mot de passe au serveur 
                    fetch("/passChange", {
                        method: "POST",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({oldPass: htmlspecialchars(oldPass.value), newPass: htmlspecialchars(newPass.value), username: getCookie("username")})
                    })
                    .then(function(res){ return res.json(); })
                    //Récupération de la réponse
                    .then(function(data){
                        if(data.result == "Success") {
                            //Affichage d'un message de réussite de changement de mot de passe
                            info.style.display = "none";
                            list.style.filter = "blur(0px)";
                            nav.style.filter = "blur(0px)";
                            $("#modif").modal("hide");
                        }
                        //Sinon affichage d'un message d'erreur 
                        else if(data.result == "Fail") {
                            info.style.display = "inline";
                            info.innerText = "Mauvais mot de passe";
                        }
                    })
                }
                //Sinon affichage d'un message d'erreur 
                else {
                    info.style.display = "inline";
                    info.innerText = "Mots de passe différents";
                }
            }
            //Sinon affichage d'un message d'erreur 
            else {
                info.style.display = "inline";
                info.innerText = "Manque de chiffre";
            }
        }
        //Sinon affichage d'un message d'erreur 
        else {
            info.style.display = "inline";
            info.innerText = "Trop court";
        }
    }
}