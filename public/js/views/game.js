// ------ game variables
const playersLeftContainer = document.getElementById("players-left");
const playersTopContainer = document.getElementById("players-top");
const playersRightContainer = document.getElementById("players-right");
const mainDeckDiv = document.createElement("div");
const mainDeckContainer = document.getElementById("main-deck-container");
const drawDeckDiv = document.getElementById("draw-deck");
const playedDeckDiv = document.getElementById("played-deck");

// ------ game methods
const getGameState = async () => {
    fetch(`/api${window.location.pathname}`)
        .then(response => response.json())
        .then(data => {
            if (data.gameState) {
                buildGameBoard(data.gameState.players);
                getDrawDeck(data.gameState.drawDeckCount);
                getPlayedDeck(data.gameState.playedDeck);
                getMainPlayerDeck(data.gameState.mainDeck);
            }
        })
        .catch(err => console.log(err));
}

const buildGameBoard = async (players) => {
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
};

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
};

const createCard = (card, type) => {
    switch (type) {
        case "draw": {
            return (
                `<div class="card-b black draw-play-deck-item card-b-big" onclick="drawCard(this);">
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
                `<div class="card num-${card.value} ${card.color} draw-play-deck-item">
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
                `<div id="${card.id}" class="card num-${card.value} ${card.color}" onclick="playCard(this);">
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

const getDrawDeck = async (drawDeckCount) => {
    drawDeckDiv.innerHTML = "";
    for (let i = 0; i < drawDeckCount; i++) drawDeckDiv.innerHTML = drawDeckDiv.innerHTML + createCard({}, "draw");
};

const getPlayedDeck = async (playedDeck) => {
    playedDeckDiv.innerHTML = "";
    playedDeck.forEach(card => playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(card, "played"));
};

const getMainPlayerDeck = async (mainDeck) => {
    mainDeck.length > 9 ? mainDeckDiv.setAttribute("id", "main-player-deck-grid") : mainDeckDiv.setAttribute("id", "main-player-deck-flex");
    mainDeckDiv.innerHTML = "";
    mainDeck.forEach(card => mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main"));
    mainDeckContainer.appendChild(mainDeckDiv);
}

// ------ game actions
const playCard = (element) => {
    // const id = parseInt(element.id);

    // let card = mainDeck.find(c => c.id === id);

    // playedDeck.push(card);
    // mainDeck = mainDeck.filter(c => c !== card);

    // mainDeck.length > 9 ? mainDeckDiv.setAttribute("id", "main-player-deck-grid") : mainDeckDiv.setAttribute("id", "main-player-deck-flex");
    // mainDeckDiv.removeChild(element);
    // playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(card, "played");
}

const drawCard = (element) => {
    // let card = drawDeck.pop();

    // mainDeck.push(card);

    // drawDeckDiv.removeChild(element);
    // mainDeck.length > 9 ? mainDeckDiv.setAttribute("id", "main-player-deck-grid") : mainDeckDiv.setAttribute("id", "main-player-deck-flex");
    // mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main");
}