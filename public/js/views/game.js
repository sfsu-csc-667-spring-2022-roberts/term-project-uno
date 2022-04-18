// ------ game variables
const playersLeftContainer = document.getElementById("players-left");
const playersTopContainer = document.getElementById("players-top");
const playersRightContainer = document.getElementById("players-right");
const mainDeckContainer = document.querySelector(".main-deck-container");
const drawDeckDiv = document.getElementById("draw-deck");
const playedDeckDiv = document.getElementById("played-deck");
const leaveBtn = document.getElementById("leave-game-btn");
const mainDeckDiv = document.createElement("div");
mainDeckDiv.setAttribute("id", "main-player-cards");
const leavePopUpDiv = document.createElement("div");
const settingsBtn = document.getElementById("game-settings-icon");
const bgColors = ['bg-black-gradient', 'bg-orange-gradient', 'bg-green-gradient', 'bg-red-gradient', 'bg-blue-gradient', 'bg-lime-gradient', 'bg-random'];
let selectedColor = bgColors[6];
let playerOrderReversed = false;
let currentIndex = 0;
let mainIndex = 0;

// ------ game listeners

leaveBtn.onclick = (e) => {
    leavePopUpDiv.setAttribute("id", "popup-div-container");
    leavePopUpDiv.innerHTML = "<div id='popup-div'><header><h2>Are you sure you want to leave the game?</h2></header><h5>This will count as a loss</h5><div id='leave-btns-container'><button id='leave-btn-cancel'>Cancel</button><button id='leave-btn-confirm'>Leave</button></div></div>";
    document.body.appendChild(leavePopUpDiv);
    document.getElementById("leave-btn-cancel").onclick = (e) => {
        document.body.removeChild(leavePopUpDiv);
    }
    document.getElementById("leave-btn-confirm").onclick = (e) => {
        window.location.replace("/");
    }
}

settingsBtn.onclick = (e) => {
    leavePopUpDiv.setAttribute("id", "popup-div-container");
    leavePopUpDiv.innerHTML = `<div id='popup-div'>
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
    document.body.appendChild(leavePopUpDiv);
    leavePopUpDiv.onclick = (e) => {
        if (leavePopUpDiv === e.target) document.body.removeChild(leavePopUpDiv);
    }
}

const changeBackgroundColor = (e) => {
    if (!e.className.includes(selectedColor)) {
        document.body.removeChild(leavePopUpDiv);
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

// ------ game methods
const getGameState = async () => {
    fetch(`/api${window.location.pathname}`)
        .then(response => response.json())
        .then(data => {
            if (data.gameState) {
                playerOrderReversed = data.gameState.playerOrderReversed;
                mainIndex = data.gameState.players[0].turnIndex;
                currentIndex = data.gameState.turnIndex;
                buildGameBoard(data.gameState.players, currentIndex, playerOrderReversed);
                getMainPlayerDeck(data.gameState.mainDeck, mainIndex, playerOrderReversed);
                getDrawDeck(data.gameState.drawDeckCount);
                getPlayedDeck(data.gameState.playedDeck);
            } else window.location.replace("/");
        })
        .catch(err => console.log(err))
}

const buildGameBoard = async (players, currentIndex, reversed) => {
    console.log(players);
    switch (players.length) {
        case 2: {
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + createPlayer(players[1], "top", "middle", currentIndex, reversed);
            break;
        }
        case 3: {
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[1], "top", "left", currentIndex, reversed)} ${createPlayer(players[2], "top", "right", currentIndex, reversed)}`;
            break;
        }
        case 4: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + createPlayer(players[1], "left", "middle", currentIndex, reversed);
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + createPlayer(players[2], "top", "middle", currentIndex, reversed);
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + createPlayer(players[3], "right", "middle", currentIndex, reversed);
            break;
        }
        case 5: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + createPlayer(players[1], "left", "middle", currentIndex, reversed);
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[2], "top", "left", currentIndex, reversed)} ${createPlayer(players[3], "top", "right", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + createPlayer(players[4], "right", "middle", currentIndex, reversed);
            break;
        }
        case 6: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + createPlayer(players[1], "left", "middle", currentIndex, reversed);
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[2], "top", "left", currentIndex, reversed)} ${createPlayer(players[3], "top", "middle", currentIndex, reversed)} ${createPlayer(players[4], "top", "right", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + createPlayer(players[5], "right", "middle", currentIndex, reversed);
            break;
        }
        case 7: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[2], "left", "top", currentIndex, reversed)} ${createPlayer(players[1], "left", "bottom", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[3], "top", "left", currentIndex, reversed)} ${createPlayer(players[4], "top", "right", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[5], "right", "top", currentIndex, reversed)} ${createPlayer(players[6], "right", "bottom", currentIndex, reversed)}`;
            break;
        }
        case 8: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[2], "left", "top", currentIndex, reversed)} ${createPlayer(players[1], "left", "bottom", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[3], "top", "left", currentIndex, reversed)} ${createPlayer(players[4], "top", "middle", currentIndex, reversed)} ${createPlayer(players[5], "top", "right", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[6], "right", "top", currentIndex, reversed)} ${createPlayer(players[7], "right", "bottom", currentIndex, reversed)}`;
            break;
        }
        case 9: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[3], "left", "top", currentIndex, reversed)} ${createPlayer(players[2], "left", "middle", currentIndex, reversed)} ${createPlayer(players[1], "left", "bottom", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[4], "top", "left", currentIndex, reversed)} ${createPlayer(players[5], "top", "right", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[6], "right", "top", currentIndex, reversed)} ${createPlayer(players[7], "right", "middle", currentIndex, reversed)} ${createPlayer(players[8], "right", "bottom", currentIndex, reversed)}`;
            break;
        }
        case 10: {
            playersLeftContainer.innerHTML = playersLeftContainer.innerHTML + `${createPlayer(players[3], "left", "top", currentIndex, reversed)} ${createPlayer(players[2], "left", "middle", currentIndex, reversed)} ${createPlayer(players[1], "left", "bottom", currentIndex, reversed)}`;
            playersTopContainer.innerHTML = playersTopContainer.innerHTML + `${createPlayer(players[4], "top", "left", currentIndex, reversed)} ${createPlayer(players[5], "top", "middle", currentIndex, reversed)} ${createPlayer(players[6], "top", "right", currentIndex, reversed)}`;
            playersRightContainer.innerHTML = playersRightContainer.innerHTML + `${createPlayer(players[7], "right", "top", currentIndex, reversed)} ${createPlayer(players[8], "right", "middle", currentIndex, reversed)} ${createPlayer(players[9], "right", "bottom", currentIndex, reversed)}`;
            break;
        }
        default: return null;
    }
};

const createPlayer = (player, placement, position, currentIndex, reversed) => {
    const defaultAvatar = "/images/default-profile-pic.png";
    let cardsString = "";
    for (let i = 0; i < player.cards; i++) {
        if (i > 27) break;
        cardsString += createCard({}, "player");
    }
    switch (placement) {
        case "left": {
            return (
                `<div id="player-${player.turnIndex}" class="players-left-item">
                    <div id="players-left-${position}-deck" class="players-left-cards">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div-left">
                        <img alt="player avatar" class="player-avatar" src="${player.avatar ? player.avatar : defaultAvatar}" />
                        <label class="player-username">${player.username} <label style="display:inline; color: #FFFFFF; text-shadow: 2px 1px 2px #000000; font-size: 12px; margin-left: 5px; z-index:3;">${player.cards}</label></label>
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
                    <div id="players-top-${position}-deck" class="players-top-cards">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div">
                        <img alt="player avatar" class="player-avatar" src="${player.avatar ? player.avatar : defaultAvatar}" />
                        <label class="player-username">${player.username} <label style="display:inline; color: #FFFFFF; text-shadow: 2px 1px 2px #000000; font-size: 12px; margin-left: 5px; z-index:3;">${player.cards}</label></label>
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
                    <div id="players-right-${position}-deck" class="players-right-cards">
                        ${cardsString}
                    </div>
                    <div class="player-avatar-div-right">
                        <img alt="player avatar" class="player-avatar" src="${player.avatar ? player.avatar : defaultAvatar}" />
                        <label class="player-username"><label style="color: #FFFFFF; text-shadow: 2px 1px 2px #000000; font-size: 12px; margin-right: 5px;">${player.cards}</label> ${player.username}</label>
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

const createCard = (card, type) => {
    switch (type) {
        case "draw": {
            return (
                `<div class="card-b black draw-play-deck-item card-b-big" onclick="drawCard(this);">
                    <span class="inner-b">
                        <span class="mark-black">
                            <img class="card-logo-big" src="/images/uno-logo.png" alt="card logo"/>
                        </span>
                    </span>
                </div>`
            );
        }
        case "played": {
            switch (card.value) {
                case "choose" : {
                    return (
                        `<div style="width: 87px;" class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner">
                                <img class="wild-choose-img" src="/images/uno-wild.png" alt="choose"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="choose"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="choose"/>
                        </div>`
                    );
                }
                case "plus4choose" : {
                    return (
                        `<div class="card ${card.value} ${card.color} draw-play-deck-item">
                            <span class="inner">
                                <span style="background-color: white; padding: 0px;" class="mark">
                                    <img class="plus4-img" src="/images/uno-plus4.png" alt="plus 4"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "plus2" : {
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
                case "reverse" : {
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
                case "skip" : {
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
                case "swap" : {
                    return (
                        `<div class="card num-${card.value} ${card.color} draw-play-deck-item" >
                            <span class="inner">
                                <span class="mark">
                                    <div class="card-value">${card.value}</div>
                                </span>
                            </span>
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
                case "choose" : {
                    return (
                        `<div id="${card.id}" style="width: 87px;" class="card ${card.value} ${card.color}" onclick="playCard(this);">
                            <span class="inner">
                                <img class="wild-choose-img" src="/images/uno-wild.png" alt="choose"/>
                            </span>
                            <img class="wild-img-small wild-img-small-top" src="/images/uno-wild.png" alt="choose"/>
                            <img class="wild-img-small wild-img-small-bottom" src="/images/uno-wild.png" alt="choose"/>
                        </div>`
                    );
                }
                case "plus4choose" : {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this);">
                            <span class="inner">
                                <span style="background-color: white; padding: 0px;" class="mark">
                                    <img class="plus4-img" src="/images/uno-plus4.png" alt="plus 4"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "plus2" : {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this);">
                            <span class="inner">
                                <span class="mark">
                                    <img class="plus2-img" src="/images/uno-plus2.png" alt="plus 2"/>
                                </span>
                            </span>
                        </div>`
                    );
                }
                case "reverse" : {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this);">
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
                case "skip" : {
                    return (
                        `<div id="${card.id}" class="card ${card.value} ${card.color}" onclick="playCard(this);">
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
                case "swap" : {
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
                default: {
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
    for (let i = 0; i < drawDeckCount; i++) drawDeckDiv.innerHTML = drawDeckDiv.innerHTML + createCard({}, "draw");
};

const getPlayedDeck = async (playedDeck) => {
    playedDeckDiv.innerHTML = "";
    playedDeck.forEach(card => playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(card, "played"));
};

const getMainPlayerDeck = async (mainDeck, index, reversed) => {
    mainDeckContainer.setAttribute("id", `player-${index}`);
    mainDeckContainer.innerHTML = mainDeckContainer.innerHTML + `
    <div class="arrow-container arrow-main-container ${index === currentIndex ? "" : "hidden"} ${reversed ? "reverse-main" : ""}">
        <div class="arrow-sliding"><div class="arrow"></div></div>
        <div class="arrow-sliding delay1"><div class="arrow"></div></div>
        <div class="arrow-sliding delay2"><div class="arrow"></div></div>
        <div class="arrow-sliding delay3"><div class="arrow"></div></div>
    </div>`
    mainDeckDiv.innerHTML = "";
    mainDeck.forEach(card => mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(card, "main"));
    mainDeckContainer.appendChild(mainDeckDiv);
}

const getNextTurn = (newCurrentIndex) => {
    let currentElementChildren = document.getElementById(`player-${currentIndex}`).children;
    let nextElementChildren = document.getElementById(`player-${newCurrentIndex}`).children;
    for (let i = 0; i < currentElementChildren.length; i++) {
        if (currentElementChildren[i].className.includes("arrow")) currentElementChildren[i].className = currentElementChildren[i].className + " hidden";
    }
    for (let i = 0; i < nextElementChildren.length; i++) {
        if (nextElementChildren[i].className.includes("arrow")) nextElementChildren[i].className = nextElementChildren[i].className.replace("hidden", "");
    }
    currentIndex = newCurrentIndex;
}

// ------ game actions
const playCard = (element) => {
    if (mainIndex === currentIndex) {
        fetch(`/api${window.location.pathname}/playCard`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: element.id })
        })
            .then(response => response.json())
            .then(data => data.success ? handlePlay(data, element) : null)
            .catch(err => console.log(err));
    }
}

const drawCard = (element) => {
    if (mainIndex === currentIndex) {
        fetch(`/api${window.location.pathname}/drawCard`, { method: 'PATCH' })
            .then(response => response.json())
            .then(data => data.success ? handleDraw(data, element) : null)
            .catch(err => console.log(err));
    }
}

const handlePlay = (data, element) => {
    mainDeckDiv.removeChild(element);
    playedDeckDiv.innerHTML = playedDeckDiv.innerHTML + createCard(data.card, "played");
    getNextTurn(data.currentIndex)
}

const handleDraw = (data, element) => {
    mainDeckDiv.innerHTML = mainDeckDiv.innerHTML + createCard(data.card, "main");
    drawDeckDiv.removeChild(element);
    getNextTurn(data.currentIndex);
}

const handleReverse = () => {
    let arrowDivs = document.getElementsByClassName("arrow-container");
    playerOrderReversed = !playerOrderReversed;
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

}
