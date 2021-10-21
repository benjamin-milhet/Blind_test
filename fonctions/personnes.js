const users = [];

function userJoin(id, username, room, nbTour, score, etat, createur){
    const user = {id, username, room, nbTour, score, etat, createur};
    users.push(user);

    return user;
}

function getCurrentUser(id){
    return users.find(user => user.id ===id);
}

function getPersonnes(){
    return users;
}

function removeUser(id){
    const index = users.findIndex(user => user.id === id);

    if(index !== -1){
        return users.splice(index, 1);
    }
}

function getRoomUsers(room){
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin,
    getCurrentUser,
    getPersonnes,
    removeUser,
    getRoomUsers
}