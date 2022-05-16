const socket = io();

const playersLeftContainer = document.getElementById("players-left");
const playersTopContainer = document.getElementById("players-top");
const playersRightContainer = document.getElementById("players-right");
const mainDeckContainer = document.querySelector(".main-deck-container");
const drawDeckDiv = document.getElementById("draw-deck");
const playedDeckDiv = document.getElementById("played-deck");
const leaveBtn = document.getElementById("leave-game-btn");
const mainDeckDiv = document.createElement("div");
mainDeckDiv.setAttribute("id", "main-player-cards");
const popUpDiv = document.createElement("div");
const settingsBtn = document.getElementById("game-settings-icon");
const bgColors = ['bg-black-gradient', 'bg-orange-gradient', 'bg-green-gradient', 'bg-red-gradient', 'bg-blue-gradient', 'bg-lime-gradient', 'bg-random'];
let selectedColor = bgColors[6];
let currentTurnIndex;
let mainIndex;

socket.on('play-card', (data) => handlePlay(data));
socket.on('draw-card', (data) => handleDraw(data));
socket.on('leave', (message) => {
    try {
        const data = JSON.parse(message);
        getDrawDeck(data.drawDeckCount);
        buildGameBoard(data.players, data.turnIndex, data.playerOrderReversed);
    } catch (err) {
        console.error(err);
    }
});
socket.on('redirect', (message) => {
    try {
        const data = JSON.parse(message);
        if (data.pathname) {
            const baseURL = `${window.location.protocol}//${window.location.host}`;
            window.location.href = baseURL + data.pathname;
        }
    } catch (err) {
        console.error(err);
    }
});

leaveBtn.onclick = (e) => {
    popUpDiv.setAttribute("id", "popup-div-container");
    popUpDiv.innerHTML = "<div id='popup-div'><header><h2>Are you sure you want to leave the game?</h2></header><h5>This will count as a loss</h5><div id='leave-btns-container'><button id='leave-btn-cancel'>Cancel</button><button id='leave-btn-confirm'>Leave</button></div></div>";
    document.body.appendChild(popUpDiv);
    document.getElementById("leave-btn-cancel").onclick = (e) => {
        document.body.removeChild(popUpDiv);
    }
    document.getElementById("leave-btn-confirm").onclick = async (e) => {
        const pathnames = window.location.pathname.split('/');
        const gameId = pathnames[pathnames.length - 1];
        await fetch(`/api/games/${gameId}/players`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .catch((err) => {
                console.error(err);
            })
    }
}

settingsBtn.onclick = (e) => {
    popUpDiv.setAttribute("id", "popup-div-container");
    popUpDiv.innerHTML = `<div id='popup-div'>
                                   <header><h2>Game Settings</h2></header>
                                   <h5>Background Color</h5>
                                   <div class='bg-colors-div'>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[0]} ${selectedColor.includes(bgColors[0]) ? ' bg-selected' : ''}"></div>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[1]} ${selectedColor.includes(bgColors[1]) ? ' bg-selected' : ''}"></div>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[2]} ${selectedColor.includes(bgColors[2]) ? ' bg-selected' : ''}"></div>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[3]} ${selectedColor.includes(bgColors[3]) ? ' bg-selected' : ''}"></div>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[4]} ${selectedColor.includes(bgColors[4]) ? ' bg-selected' : ''}"></div>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[5]} ${selectedColor.includes(bgColors[5]) ? ' bg-selected' : ''}"></div>
                                       <div onclick="changeBackgroundColor(this);" class="${bgColors[6]} ${selectedColor.includes(bgColors[6]) ? ' bg-selected' : ''}"><label class='bg-question-label'>Random</label></div>
                                    </div>`;
    document.body.appendChild(popUpDiv);
    popUpDiv.onclick = (e) => {
        if (popUpDiv === e.target) document.body.removeChild(popUpDiv);
    }
}

const changeBackgroundColor = (e) => {
    if (!e.className.includes(selectedColor)) {
        document.body.removeChild(popUpDiv);
        localStorage.setItem('bg', e.className);
        getBackgroundColor();
    }
}

const getBackgroundColor = async () => {
    const bg = localStorage.getItem('bg');
    let color = '';
    let isRandom = false;
    if (!bg || bg.includes('bg-random')) isRandom = true;
    if (isRandom) {
        const randomIndex = Math.floor(Math.random() * 6);
        color = bgColors[randomIndex];
        if (bg !== 'bg-random') localStorage.setItem('bg', 'bg-random');
        selectedColor = 'bg-random';
    } else {
        color = bg;
        selectedColor = color;
    }
    document.body.setAttribute("class", color);
}

const getGameState = async () => {
    fetch(`/api${window.location.pathname}`)
        .then(response => response.json())
        .then(data => {
            if (data.gameState) {
                mainIndex = data.gameState.players[0].turnIndex;
                currentTurnIndex = data.gameState.turnIndex;
                buildGameBoard(data.gameState.players, currentTurnIndex, data.gameState.playerOrderReversed);
                getMainPlayerDeck(data.gameState.mainDeck, mainIndex, currentTurnIndex, data.gameState.playerOrderReversed);
                getDrawDeck(data.gameState.drawDeckCount);
                getPlayedDeck(data.gameState.playedDeck, data.gameState.currentColor);
            } else window.location.replace("/");
        })
        .catch(err => console.error(err))
}

const buildGameBoard = async (players, currentIndex, reversed) => {
    // Clear out player containers
    playersLeftContainer.innerHTML = '';
    playersTopContainer.innerHTML = '';
    playersRightContainer.innerHTML = '';

    switch (players.length) {
        case 2: {
            playersTopContainer.innerHTML = createPlayer(players[1], "top", currentIndex, reversed);
            break;
        }
        case 3: {
            playersTopContainer.innerHTML = `${createPlayer(players[1], "top", currentIndex, reversed)} ${createPlayer(players[2], "top", currentIndex, reversed)}`;
            break;
        }
        case 4: {
            playersLeftContainer.innerHTML = createPlayer(players[1], "left", currentIndex, reversed);
            playersTopContainer.innerHTML = createPlayer(players[2], "top", currentIndex, reversed);
            playersRightContainer.innerHTML = createPlayer(players[3], "right", currentIndex, reversed);
            break;
        }
        case 5: {
            playersLeftContainer.innerHTML = createPlayer(players[1], "left", currentIndex, reversed);
            playersTopContainer.innerHTML = `${createPlayer(players[2], "top", currentIndex, reversed)} ${createPlayer(players[3], "top", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = createPlayer(players[4], "right", currentIndex, reversed);
            break;
        }
        case 6: {
            playersLeftContainer.innerHTML = createPlayer(players[1], "left", currentIndex, reversed);
            playersTopContainer.innerHTML = `${createPlayer(players[2], "top", currentIndex, reversed)} ${createPlayer(players[3], "top", currentIndex, reversed)} ${createPlayer(players[4], "top", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = createPlayer(players[5], "right", currentIndex, reversed);
            break;
        }
        case 7: {
            playersLeftContainer.innerHTML = `${createPlayer(players[2], "left", currentIndex, reversed)} ${createPlayer(players[1], "left", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = `${createPlayer(players[3], "top", currentIndex, reversed)} ${createPlayer(players[4], "top", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = `${createPlayer(players[5], "right", currentIndex, reversed)} ${createPlayer(players[6], "right", currentIndex, reversed)}`;
            break;
        }
        case 8: {
            playersLeftContainer.innerHTML = `${createPlayer(players[2], "left", currentIndex, reversed)} ${createPlayer(players[1], "left", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = `${createPlayer(players[3], "top", currentIndex, reversed)} ${createPlayer(players[4], "top", currentIndex, reversed)} ${createPlayer(players[5], "top", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = `${createPlayer(players[6], "right", currentIndex, reversed)} ${createPlayer(players[7], "right", currentIndex, reversed)}`;
            break;
        }
        case 9: {
            playersLeftContainer.innerHTML = `${createPlayer(players[3], "left", currentIndex, reversed)} ${createPlayer(players[2], "left", currentIndex, reversed)} ${createPlayer(players[1], "left", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = `${createPlayer(players[4], "top", currentIndex, reversed)} ${createPlayer(players[5], "top", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = `${createPlayer(players[6], "right", currentIndex, reversed)} ${createPlayer(players[7], "right", currentIndex, reversed)} ${createPlayer(players[8], "right", currentIndex, reversed)}`;
            break;
        }
        case 10: {
            playersLeftContainer.innerHTML = `${createPlayer(players[3], "left", currentIndex, reversed)} ${createPlayer(players[2], "left", currentIndex, reversed)} ${createPlayer(players[1], "left", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = `${createPlayer(players[4], "top", currentIndex, reversed)} ${createPlayer(players[5], "top", currentIndex, reversed)} ${createPlayer(players[6], "top", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = `${createPlayer(players[7], "right", currentIndex, reversed)} ${createPlayer(players[8], "right", currentIndex, reversed)} ${createPlayer(players[9], "right", currentIndex, reversed)}`;
            break;
        }
        default: return null;
    }
};

const createPlayer = (player, placement, currentIndex, reversed) => {
    const defaultAvatar = "/images/default-profile-pic.png";
    let cardsString = "";
    for (let i = 0; i < player.cards; i++) {
        cardsString += createCard({}, "player", null);
    }
    switch (placement) {
        case "left": {
            return (
                `<div id="player-${player.turnIndex}" class="players-left-item">
                    <div id="player-${player.turnIndex}-cards" class="players-left-cards">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div-left">
                        <div class='avatar-container'>
                        <img alt="player avatar" class="${player.portrait ? 'player-avatar-portrait' : 'player-avatar-landscape'}" src="${player.avatar ? player.avatar : defaultAvatar}" />
                        </div>
                        <label class="player-username">${player.username} <label id="player-${player.turnIndex}-cardcount" style="display:inline; color: #FFFFFF; text-shadow: 2px 1px 2px #000000; font-size: 12px; margin-left: 5px; z-index:3;">${player.cards}</label></label>
                    </div>
                    <div class="arrow-container arrow-left-container ${player.turnIndex === currentIndex ? "" : "hidden"} ${reversed ? "reverse-left" : ""}">
                        <div class="arrow-sliding"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay1"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay2"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay3"><div class="arrow"></div></div>
                    </div>
                </div>`
            );
        }
        case "top": {
            return (
                `<div id="player-${player.turnIndex}" class="players-top-item">
                    <div id="player-${player.turnIndex}-cards" class="players-top-cards">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div">
                        <div class='avatar-container'>
                        <img alt="player avatar" class="${player.portrait ? 'player-avatar-portrait' : 'player-avatar-landscape'}" src="${player.avatar ? player.avatar : defaultAvatar}" />
                        </div>
                        <label class="player-username">${player.username} <label id="player-${player.turnIndex}-cardcount" style="display:inline; color: #FFFFFF; text-shadow: 2px 1px 2px #000000; font-size: 12px; margin-left: 5px; z-index:3;">${player.cards}</label></label>
                    </div>
                    <div class="arrow-container arrow-top-container ${player.turnIndex === currentIndex ? "" : "hidden"} ${reversed ? "reverse-top" : ""}">
                        <div class="arrow-sliding"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay1"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay2"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay3"><div class="arrow"></div></div>
                    </div>
                </div>`
            );
        }
        case "right": {
            return (
                `<div id="player-${player.turnIndex}" class="players-right-item">
                    <div id="player-${player.turnIndex}-cards" class="players-right-cards">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div-right">
                        <div class='avatar-container'>
                        <img alt="player avatar" class="${player.portrait ? 'player-avatar-portrait' : 'player-avatar-landscape'}" src="${player.avatar ? player.avatar : defaultAvatar}" />
                        </div>
                        <label class="player-username"><label id="player-${player.turnIndex}-cardcount" style="color: #FFFFFF; text-shadow: 2px 1px 2px #000000; font-size: 12px; margin-right: 5px;">${player.cards}</label> ${player.username}</label>
                    </div>
                    <div class="arrow-container arrow-right-container ${player.turnIndex === currentIndex ? "" : "hidden"} ${reversed ? "reverse-right" : ""}">
                        <div class="arrow-sliding"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay1"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay2"><div class="arrow"></div></div>
                        <div class="arrow-sliding delay3"><div class="arrow"></div></div>
                    </div>
                </div>`
            );
        }
        default: return null;
    }
};

const createCard = (card, type, currentColor) => {
    switch (type) {
        case "select": {
            switch (card.value) {
                case "choose": {
                    return (
                        `<div style="width: 87px;" class="card ${card.value} ${card.color}" onclick="playCard(${card.id}, '${card.color}', null);">
                            <span class="inner" style="color: ${card.hex};">
                                <img class="wild-choose-img" src="/images/uno-wild.png" alt="choose"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="choose"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="choose"/>
                        </div>`
                    );
                }
                case "plus4choose": {
                    return (
                        `<div class="card ${card.value} ${card.color}" onclick="playCard(${card.id}, '${card.color}', null);">
                            <span class="inner" style="background-color: ${card.hex};">
                                <span style="background-color: white; padding: 0px;" class="mark">
                                    <img class="plus4-img" src="/images/uno-plus4.png" alt="plus 4"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
            }
        }
        case "draw": {
            return (
                `<div class="card-b black draw-play-deck-item card-b-big" onclick="drawCard();">
                    <span class="inner-b">
                        <span class="mark-black">
                            <img class="card-logo-big" src="/images/uno-logo.png" alt="card logo"/>
                        </span>
                    </span>
                </div>`
            );
        }
        case "played": {
            switch (currentColor) {
                case "red": { card.hex = "#ee161f"; break; }
                case "blue": { card.hex = "#0063B3"; break; }
                case "yellow": { card.hex = "#f8db22"; break; }
                case "green": { card.hex = "#18A849"; break; }
                default: break;
            }
            switch (card.value) {
                case "choose": {
                    return (
                        `<div style="width: 87px;" class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner" style="background-color: ${card.hex};">
                                <img class="wild-choose-img" src="/images/uno-wild.png" alt="choose"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="choose"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="choose"/>
                        </div>`
                    );
                }
                case "plus4choose": {
                    return (
                        `<div class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner" style="background-color: ${card.hex};">
                                <span style="background-color: white; padding: 0px;" class="mark">
                                    <img class="plus4-img" src="/images/uno-plus4.png" alt="plus 4"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "plus2": {
                    return (
                        `<div class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner">
                                <span class="mark">
                                    <img class="plus2-img" src="/images/uno-plus2.png" alt="plus 2"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "reverse": {
                    return (
                        `<div class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner">
                                <span style="padding:0 7px;" class="mark">
                                    <img class="reverse-img" src="/images/uno-reverse.png" alt="reverse"/>
                                </span>
                            </span>
                            <img class="reverse-img-small reverse-img-small-top" src="/images/uno-reverse.png" alt="reverse"/>
                            <img class="reverse-img-small reverse-img-small-bottom" src="/images/uno-reverse.png" alt="reverse"/>
                        </div>`
                    );
                }
                case "skip": {
                    return (
                        `<div class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner">
                                <span style="padding:0 7.5px;" class="mark">
                                    <img class="skip-img" src="/images/uno-skip.png" alt="skip"/>
                                </span>
                            </span>
                            <img class="skip-img-small skip-img-small-top" src="/images/uno-skip.png" alt="skip"/>
                            <img class="skip-img-small skip-img-small-bottom" src="/images/uno-skip.png" alt="skip"/>
                        </div>`
                    );
                }
                case "swap": {
                    return (
                        `<div style="width: 87px;" class="card ${card.value} ${card.color} draw-play-deck-item" >
                            <span class="inner" style="background-color: ${card.hex};">
                                <img class="wild-choose-img" src="/images/uno-swap.png" alt="swap"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="swap"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="swap"/>
                        </div>`
                    );
                }
                default: {
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
            }
        }
        case "main": {
            switch (card.value) {
                case "choose": {
                    return (
                        `<div id="${card.id}" style="width: 87px;" class="card ${card.value} ${card.color}" onclick="playWildCard(this);">
                            <span class="inner">
                                <img class="wild-choose-img" src="/images/uno-wild.png" alt="choose"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="choose"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="choose"/>
                        </div>`
                    );
                }
                case "plus4choose": {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playWildCard(this);">
                            <span class="inner">
                                <span style="background-color: white; padding: 0px;" class="mark">
                                    <img class="plus4-img" src="/images/uno-plus4.png" alt="plus 4"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "plus2": {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this, null, null);">
                            <span class="inner">
                                <span class="mark">
                                    <img class="plus2-img" src="/images/uno-plus2.png" alt="plus 2"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "reverse": {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this, null, null);">
                            <span class="inner">
                                <span style="padding:0 7px;" class="mark">
                                    <img class="reverse-img" src="/images/uno-reverse.png" alt="reverse"/>
                                </span>
                            </span>
                            <img class="reverse-img-small reverse-img-small-top" src="/images/uno-reverse.png" alt="reverse"/>
                            <img class="reverse-img-small reverse-img-small-bottom" src="/images/uno-reverse.png" alt="reverse"/>
                        </div>`
                    );
                }
                case "skip": {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this, null, null);">
                            <span class="inner">
                                <span style="padding:0 7.5px;" class="mark">
                                    <img class="skip-img" src="/images/uno-skip.png" alt="skip"/>
                                </span>
                            </span>
                            <img class="skip-img-small skip-img-small-top" src="/images/uno-skip.png" alt="skip"/>
                            <img class="skip-img-small skip-img-small-bottom" src="/images/uno-skip.png" alt="skip"/>
                        </div>`
                    );
                }
                case "swap": {
                    return (
                        `<div id="${card.id}" style="width: 87px;" class="card ${card.value} ${card.color}" onclick="playSwapCard(this);">
                            <span class="inner">
                                <img class="wild-choose-img" src="/images/uno-swap.png" alt="swap"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="swap"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="swap"/>
                        </div>`
                    );
                }
                default: {
                    return (
                        `<div id="${card.id}" class="card num-${card.value} ${card.color}" onclick="playCard(this, null, null);">
                            <span class="inner">
                                <span class="mark">
                                    <div class="card-value">${card.value}</div>
                                </span>
                            </span>
                        </div>`
                    );
                }
            }
        }
        case "player": {
            return (
                `<div class="card-b black card-b-small">
                    <span class="inner-b">
                        <span class="mark-black">
                            <img class="card-logo-small" src="/images/uno-logo.png" alt="card logo"/>
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
    for (let i = 0; i < drawDeckCount; i++) drawDeckDiv.innerHTML = drawDeckDiv.innerHTML + createCard({}, "draw", null);
};

const getPlayedDeck = async (playedDeck, currentColor) => {
    playedDeckDiv.innerHTML = "";
    playedDeck.forEach(card => playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(card, "played", currentColor));
};

const getMainPlayerDeck = async (mainDeck, index, currentIndex, reversed) => {
    mainDeckContainer.innerHTML = "";
    mainDeckContainer.setAttribute("id", `player-${index}`);
    mainDeckContainer.innerHTML = `
    <div class="arrow-container arrow-main-container ${index === currentIndex ? "" : "hidden"} ${reversed ? "reverse-main" : ""}">
        <div class="arrow-sliding"><div class="arrow"></div></div>
        <div class="arrow-sliding delay1"><div class="arrow"></div></div>
        <div class="arrow-sliding delay2"><div class="arrow"></div></div>
        <div class="arrow-sliding delay3"><div class="arrow"></div></div>
    </div>`
    mainDeckDiv.innerHTML = "";
    mainDeck.forEach(card => mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main", null));
    mainDeckContainer.appendChild(mainDeckDiv);
}

const playSwapCard = (element) => {
    if (mainIndex === currentTurnIndex) {
        fetch(`/api${window.location.pathname}/players`)
            .then(response => response.json())
            .then(data => {
                if (data.usernames) {
                    const cid = parseInt(element.id);
                    popUpDiv.setAttribute("id", "popup-div-container");
                    popUpDiv.innerHTML = `<div id='popup-div'>
                                       <header><h2>Choose player to swap cards with</h2></header>
                                       <div class="select-username-div">
                                       ${data.usernames.map(u => `<label class="player-username" onclick="playCard(${cid}, null, '${u}');">${u}</label>`)}
                                       </div>
                                    </div>`;
                    document.body.appendChild(popUpDiv);
                    popUpDiv.onclick = (e) => {
                        if (popUpDiv === e.target) document.body.removeChild(popUpDiv);
                    }
                }
            })
            .catch(err => console.log(err));
    }
}

const playWildCard = (element) => {
    if (mainIndex === currentTurnIndex) {
        let value;
        const id = element.id;
        if (element.className.includes("plus4choose")) value = "plus4choose";
        else value = "choose";
        popUpDiv.setAttribute("id", "popup-div-container");
        popUpDiv.innerHTML = `<div id='popup-div'>
                                       <header><h2>Choose the next card color</h2></header>
                                       <div class="select-card-color-div">
                                           ${createCard({ id, value, color: "red", hex: "#ee161f", element }, "select", null)}
                                           ${createCard({ id, value, color: "blue", hex: "#0063B3", element }, "select", null)}
                                           ${createCard({ id, value, color: "yellow", hex: "#f8db22", element }, "select", null)}
                                           ${createCard({ id, value, color: "green", hex: "#18A849", element }, "select", null)}
                                        </div>
                                    </div>`;
        document.body.appendChild(popUpDiv);
        popUpDiv.onclick = (e) => {
            if (popUpDiv === e.target) document.body.removeChild(popUpDiv);
        }
    }
}

const playCard = (element, chosenColor, uname) => {
    if (mainIndex === currentTurnIndex) {
        const body = {};
        if (isNaN(element)) body.cardId = element.id;
        else {
            document.body.removeChild(popUpDiv);
            body.cardId = element;
            body.chosenColor = chosenColor;
            body.player2 = uname;
        }
        fetch(`/api${window.location.pathname}/playCard`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
            .then(response => response.json())
            .catch(err => console.log(err));
    }
}

const handlePlay = async (data) => {
    try {
        if (data.swap) window.location.reload();
        if (data.refreshDrawCards) await getDrawDeck(data.drawDeckCount);
        if (document.getElementById(`player-${data.playerIndex}`).className.match("main-deck-container")) {
            mainDeckDiv.removeChild(document.getElementById(`${data.card.id}`))
        } else {
            document.getElementById(`player-${data.playerIndex}-cards`).lastChild.remove()
            document.getElementById(`player-${data.playerIndex}-cardcount`).innerText = parseInt(document.getElementById(`player-${data.playerIndex}-cardcount`).innerText) - 1;
        }
        playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(data.card, "played", data.currentColor);
        if (data.reversed) handleReverse(data.playerOrderReversed);

        if (data.winner) {
            popUpDiv.setAttribute("id", "popup-div-container");
            popUpDiv.innerHTML = `<div id='popup-div'><header><h2>${data.winner} won the game!</h2></header><h5>Do you want to play again?</h5><div id='leave-btns-container'><button id='leave-btn-cancel'>Play Again</button><button id='leave-btn-confirm'>Leave</button></div></div>`;
            document.body.appendChild(popUpDiv);
            document.getElementById("leave-btn-cancel").onclick = (e) => window.location.replace(`/lobbies/${data.lobbyId}`);
            document.getElementById("leave-btn-confirm").onclick = (e) => {
                fetch(`/api/lobbies/${data.lobbyId}/users`, {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json',}
                })
                  .then(res => res.json())
                  .catch((err) => console.error(err))
                  .finally(() => window.location.replace("/"));
            }
        } else if (Number.isInteger(data.playerThatDrawsIndex)) handleDraw(data);
        else getNextTurn(data.playerIndex, data.newTurnIndex);
    } catch (error) {
        window.location.reload();
    }
}

const drawCard = () => {
    if (mainIndex === currentTurnIndex) {
        fetch(`/api${window.location.pathname}/drawCard`, { method: 'PATCH' })
            .then(response => response.json())
            .then(data => (data.status !== 200) ? window.location.reload() : null)
            .catch(err => console.log(err));
    }
}

const handleDraw = async (data) => {
    try {
        if (data.refreshDrawCards) await getDrawDeck(data.drawDeckCount);
        if (document.getElementById(`player-${data.playerThatDrawsIndex}`).className.match("main-deck-container")) {
            fetch(`/api${window.location.pathname}/getCards`)
                .then(response => response.json())
                .then(respData => {
                    if (respData.cards) {
                        mainDeckDiv.innerHTML = "";
                        respData.cards.forEach(card => mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main", null));
                        getNextTurn(data.playerIndex, data.newTurnIndex);
                    }
                })
                .catch(err => console.log(err));
        } else {
            let cardsString = "";
            const cardCount = document.getElementById(`player-${data.playerThatDrawsIndex}-cardcount`);
            const newCardCount = parseInt(cardCount.innerText) + data.amount;
            cardCount.innerText = newCardCount;
            for (let i = 0; i < newCardCount; i++) {
                cardsString += createCard({}, "player", null);
            }
            document.getElementById(`player-${data.playerThatDrawsIndex}-cards`).innerHTML = cardsString;
            getNextTurn(data.playerIndex, data.newTurnIndex);
        }
    } catch (error) {
        window.location.reload();
    }
}

const getNextTurn = (currentIndex, newCurrentIndex) => {
    try {
        let currentElementChildren = document.getElementById(`player-${currentIndex}`).children;
        let nextElementChildren = document.getElementById(`player-${newCurrentIndex}`).children;
        if (!currentElementChildren || !nextElementChildren) window.location.reload();
        for (let i = 0; i < currentElementChildren.length; i++) {
            if (currentElementChildren[i].className.includes("arrow")) currentElementChildren[i].className = currentElementChildren[i].className + " hidden";
        }
        for (let i = 0; i < nextElementChildren.length; i++) {
            if (nextElementChildren[i].className.includes("arrow")) nextElementChildren[i].className = nextElementChildren[i].className.replace("hidden", "");
        }
        currentTurnIndex = newCurrentIndex;
    } catch (error) {
        window.location.reload()
    }
}

const handleReverse = (playerOrderReversed) => {
    try {
        let arrowDivs = document.getElementsByClassName("arrow-container");
        if (playerOrderReversed) {
            for (let i = 0; i < arrowDivs.length; i++) {
                let s = ""
                if (arrowDivs[i].className.includes("left")) s = " reverse-left";
                else if (arrowDivs[i].className.includes("right")) s = " reverse-right";
                else if (arrowDivs[i].className.includes("top")) s = " reverse-top";
                else s = " reverse-main";
                arrowDivs[i].className = arrowDivs[i].className + s;
            }
        } else {
            for (let i = 0; i < arrowDivs.length; i++) {
                if (arrowDivs[i].className.includes("left")) arrowDivs[i].className = arrowDivs[i].className.replace("reverse-left", "");
                else if (arrowDivs[i].className.includes("right")) arrowDivs[i].className = arrowDivs[i].className.replace("reverse-right", "");
                else if (arrowDivs[i].className.includes("top")) arrowDivs[i].className = arrowDivs[i].className.replace("reverse-top", "");
                else arrowDivs[i].className = arrowDivs[i].className.replace("reverse-main", "");
            }
        }
    } catch (error) {
        window.location.reload()
    }
}