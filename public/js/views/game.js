let mainDeckDiv = document.createElement("div");
let drawDeckDiv = document.getElementById("draw-deck");
let playedDeckDiv = document.getElementById("played-deck");

let drawDeck = [
    { id: 2, value: 9, color: "yellow" },
    { id: 3, value: 1, color: "green" },
    { id: 4, value: 6, color: "blue" },
    { id: 5, value: 4, color: "blue" },
    { id: 6, value: 6, color: "yellow" },
    { id: 7, value: 0, color: "red" },
    { id: 8, value: 9, color: "blue" },
    { id: 9, value: 3, color: "yellow" },
    { id: 10, value: 5, color: "green" },
    { id: 11, value: 8, color: "red" },
    { id: 12, value: 7, color: "blue" },
    { id: 13, value: 3, color: "yellow" },
    { id: 14, value: 5, color: "blue" },
    { id: 15, value: 8, color: "red" },
    { id: 16, value: 7, color: "green" },
    { id: 17, value: 4, color: "yellow" },
    { id: 18, value: 4, color: "blue" },
    { id: 19, value: 8, color: "red" },
    { id: 20, value: 0, color: "red" },
];

let playedDeck = [
    { id: 1, value: 5, color: "red" },
    { id: 27, value: 4, color: "red" },
    { id: 28, value: 4, color: "blue" },
    { id: 29, value: 8, color: "yellow" },
];

let mainDeck = [
    { id: 21, value: 5, color: "red" },
    { id: 22, value: 9, color: "yellow" },
    { id: 23, value: 1, color: "green" },
    { id: 24, value: 6, color: "blue" },
    { id: 25, value: 4, color: "blue" },
    { id: 26, value: 6, color: "yellow" },
    { id: 27, value: 1, color: "yellow" },
];

let messages = [
    { id: 1, sender: "snowpuff808", message: "You're trash, kys ", time: "5:49 PM" },
    { id: 2, sender: "dawggydawg6969", message: "Look whose talking bruh, you have a whole ass 15 cards", time: "5:51 PM" },
    { id: 3, sender: "snowpuff808", message: "Keep running your mouth, I'll be sure to place a +4 on your ass", time: "5:53 PM" },
    { id: 4, sender: "dawggydawg6969", message: "and you eat ass... a ha ha", time: "5:53 PM" },
    { id: 5, sender: "saggyballs", message: "Chill guys, relax...just play the game", time: "5:55 PM" },
];

let count = 6;

let messagePopUpToggle = false;
let messagesContainerDiv = document.getElementById("messages-container");

document.getElementById("message-icon").onclick = (e) => {
    messagePopUpToggle = !messagePopUpToggle;
    if (messagePopUpToggle) {
        messagesContainerDiv.setAttribute("class", "");
        document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
    }
    else messagesContainerDiv.setAttribute("class", "hidden");
}

const sendMessage = () => {
    let input = document.getElementById("message-input");
    if (input.value.trim().length > 0) {
        let newMessage = { id: count, sender: "iamfaisalh", message: input.value, time: timeFormat(new Date().toLocaleTimeString().split(":")) };
        messages.push(newMessage);
        input.value = "";
        fetchMessages();
        document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
        count++;
    }
}

const timeFormat = (time) => {
    return `${time[0]}:${time[1]} ${time[2].split(" ")[1]}`;
}

const fetchMessages = async () => {
    let messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = '';
    messages.forEach(message => {
        messagesDiv.innerHTML = messagesDiv.innerHTML + createMessage(message);
    });
}

document.getElementById('message-input').addEventListener("keyup", (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

const createMessage = (message) => {
    return (
        `<div id="${message.id}" class="message-container">
            <strong class="message-sender">${message.sender}</strong>
            <textarea class="message" contenteditable="false" disabled>${message.message}</textarea>
            <span class="message-time">${message.time}</span>
        </div>`
    );
}

const playCard = (element) => {

    let id = parseInt(element.id);

    let card = mainDeck.find(c => c.id === id);

    playedDeck.push(card);
    mainDeck = mainDeck.filter(c => c !== card);

    mainDeck.length > 9 ? mainDeckDiv.setAttribute("id", "main-player-deck-grid") : mainDeckDiv.setAttribute("id", "main-player-deck-flex");
    mainDeckDiv.removeChild(element);
    playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(card, "played");
}

const drawCard = (element) => {

    let card = drawDeck.pop();

    mainDeck.push(card);

    drawDeckDiv.removeChild(element);
    mainDeck.length > 9 ? mainDeckDiv.setAttribute("id", "main-player-deck-grid") : mainDeckDiv.setAttribute("id", "main-player-deck-flex");
    mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main");

}

const createCard = (card, type) => {
    switch (type) {
        case "draw": {
            return (
                `<div class="card-b black draw-play-deck-item card-b-big" onclick="drawCard(this);" >
                    <span class="inner-b">
                        <span class="mark-black">
                            <div class="card-uno-label">UNO</div>
                        </span>
                    </span>
                </div>`
            );
        }
        case "played": {
            return (
                `<div id="${card.id}" class="card num-${card.value} ${card.color} draw-play-deck-item" onclick="playCard(this);" >
                    <span class="inner">
                        <span class="mark">
                            <div class="card-value">${card.value}</div>
                        </span>
                    </span>
                </div>`
            );
        }
        case "main": {
            return (
                `<div id="${card.id}" class="card num-${card.value} ${card.color}" onclick="playCard(this);" >
                    <span class="inner">
                        <span class="mark">
                            <div class="card-value">${card.value}</div>
                        </span>
                    </span>
                </div>`
            );
        }
        case "player": {
            return (
                `<div class="card-b black card-b-small">
                    <span class="inner-b">
                        <span class="mark-black">
                            <div class="card-uno-label-small">UNO</div>
                        </span>
                    </span>
                </div>`
            );
        }
        default: return null;
    }
}

const getMainPlayerDeck = async () => {
    let mainDeckContainer = document.getElementById("main-deck-container");

    mainDeck.length > 9 ? mainDeckDiv.setAttribute("id", "main-player-deck-grid") : mainDeckDiv.setAttribute("id", "main-player-deck-flex");

    mainDeck.forEach(card => {
        mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main");
    });

    mainDeckContainer.appendChild(mainDeckDiv);
}

const getDrawDeck = async () => {
    drawDeck.forEach(card => {
        drawDeckDiv.innerHTML = drawDeckDiv.innerHTML + createCard(card, "draw");
    });
}

const getPlayedDeck = async () => {
    playedDeck.forEach(card => {
        playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(card, "played");
    });
}

let playerTopCards = [
    { id: 21, value: 5, color: "red" },
    { id: 22, value: 9, color: "yellow" },
    { id: 23, value: 1, color: "green" },
    { id: 24, value: 6, color: "blue" },
    { id: 25, value: 4, color: "blue" },
    { id: 26, value: 6, color: "yellow" },
    { id: 21, value: 5, color: "red" },
    { id: 21, value: 5, color: "red" },
    { id: 22, value: 9, color: "yellow" },
    { id: 23, value: 1, color: "green" },
    { id: 24, value: 6, color: "blue" },
    { id: 25, value: 4, color: "blue" },
    { id: 26, value: 6, color: "yellow" },
    { id: 25, value: 4, color: "blue" },
    { id: 26, value: 6, color: "yellow" },
    { id: 21, value: 5, color: "red" },
    { id: 22, value: 9, color: "yellow" },
    { id: 23, value: 1, color: "green" },
    { id: 24, value: 6, color: "blue" },
    { id: 25, value: 4, color: "blue" },
    { id: 26, value: 6, color: "yellow" },
    { id: 21, value: 5, color: "red" },
    { id: 22, value: 9, color: "yellow" },
    { id: 23, value: 1, color: "green" },
    { id: 24, value: 6, color: "blue" },
    { id: 25, value: 4, color: "blue" },
    { id: 26, value: 6, color: "yellow" },
];

let playersLeftContainer = document.getElementById("players-left");
let playersTopContainer = document.getElementById("players-top");
let playersRightContainer = document.getElementById("players-right");

let players = [
    { id: 1, userID: 392, turnIndex: 4, username: "iamfaisalh", cards: 8, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 2, userID: 521, turnIndex: 1, username: "saggyballs", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 3, userID: 222, turnIndex: 7, username: "coolguy905", cards: 10, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 4, userID: 319, turnIndex: 6, username: "joemomma", cards: 9, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 5, userID: 401, turnIndex: 9, username: "horse666", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 6, userID: 282, turnIndex: 10, username: "nike10", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 7, userID: 808, turnIndex: 2, username: "tax", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 8, userID: 913, turnIndex: 3, username: "king707", cards: 10, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 9, userID: 121, turnIndex: 5, username: "glizzy", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
    { id: 10, userID: 552, turnIndex: 8, username: "flowerboy1", cards: 7, avatar: "https://store.playstation.com/store/api/chihiro/00_09_000/container/CH/de/99/EP2402-CUSA05624_00-AV00000000000213/0/image?_version=00_09_000&platform=chihiro&bg_color=000000&opacity=100&w=330&h=330" },
];

const sortPlayers = () => {
    players.sort((a, b) => a.turnIndex - b.turnIndex);

}

const createPlayer = (player, placement, position) => {
    let cardsString = "";
    for (let i = 0; i < player.cards; i++) {
        cardsString += createCard({}, "player");
    }
    switch (placement) {
        case "left": {
            return (
                `<div id="${player.id}" class="players-left-item">
                    <div id="players-left-${position}-deck" class="players-left-deck">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div-left">
                        <img alt="player avatar" class="player-avatar" src="${player.avatar}" />
                        <label class="player-username">${player.username}</label>
                    </div>
                </div>`
            );
        }
        case "top": {
            return (
                `<div id="${player.id}" class="players-top-item">
                    <div id="players-top-${position}-deck" class="players-top-deck">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div">
                        <img alt="player avatar" class="player-avatar" src="${player.avatar}" />
                        <label class="player-username">${player.username}</label>
                    </div>
                </div>`
            );
        }
        case "right": {
            return (
                `<div id="${player.id}" class="players-right-item">
                    <div id="players-right-${position}-deck" class="players-right-deck">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div-right">
                        <img alt="player avatar" class="player-avatar" src="${player.avatar}" />
                        <label class="player-username">${player.username}</label>
                    </div>
                </div>`
            );
        }
        default: return null;
    }
}

const buildGameBoard = async () => {
    switch (players.length) {
        case 2: {
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + createPlayer(players[1], "top", "middle");
            break;
        }
        case 3: {
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[1], "top", "left")} ${createPlayer(players[2], "top", "right")}`;
            break;
        }
        case 4: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + createPlayer(players[1], "left", "middle");
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + createPlayer(players[2], "top", "middle");
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + createPlayer(players[3], "right", "middle");
            break;
        }
        case 5: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + createPlayer(players[1], "left", "middle");
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[2], "top", "left")} ${createPlayer(players[3], "top", "right")}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + createPlayer(players[4], "right", "middle");
            break;
        }
        case 6: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + createPlayer(players[1], "left", "middle");
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[2], "top", "left")} ${createPlayer(players[3], "top", "middle")} ${createPlayer(players[4], "top", "right")}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + createPlayer(players[5], "right", "middle");
            break;
        }
        case 7: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[2], "left", "top")} ${createPlayer(players[1], "left", "bottom")}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[3], "top", "left")} ${createPlayer(players[4], "top", "right")}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[5], "right", "top")} ${createPlayer(players[6], "right", "bottom")}`;
            break;
        }
        case 8: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[2], "left", "top")} ${createPlayer(players[1], "left", "bottom")}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[3], "top", "left")} ${createPlayer(players[4], "top", "middle")} ${createPlayer(players[5], "top", "right")}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[6], "right", "top")} ${createPlayer(players[7], "right", "bottom")}`;
            break;
        }
        case 9: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[3], "left", "top")} ${createPlayer(players[2], "left", "middle")} ${createPlayer(players[1], "left", "bottom")}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[4], "top", "left")} ${createPlayer(players[5], "top", "right")}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[6], "right", "top")} ${createPlayer(players[7], "right", "middle")} ${createPlayer(players[8], "right", "bottom")}`;
            break;
        }
        case 10: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[3], "left", "top")} ${createPlayer(players[2], "left", "middle")} ${createPlayer(players[1], "left", "bottom")}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[4], "top", "left")} ${createPlayer(players[5], "top", "middle")} ${createPlayer(players[6], "top", "right")}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[7], "right", "top")} ${createPlayer(players[8], "right", "middle")} ${createPlayer(players[9], "right", "bottom")}`;
            break;
        }
        default: return null;
    }
}
console.log(parseInt(window.location.pathname.split('/')[2]))

let gameState = {}
const getGameState = async () => {
    
    fetch(`/api/games/${parseInt(window.location.pathname.split('/')[2])}`)
    .then(response => response.json())
    .then(data => {
        console.log(data)
    })
    .catch(err => console.log(err));
}


document.body.onload = () => {
    // buildGameBoard();
    // getDrawDeck();
    // getPlayedDeck();
    // getMainPlayerDeck();
    // fetchMessages();
    getGameState();

}