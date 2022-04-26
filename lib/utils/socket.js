const GamesDao = require("../../db/dao/games");
const PlayersDao = require("../../db/dao/players");
const PlayedCardsDao = require("../../db/dao/playedCards");
const PlayerCardsDao = require("../../db/dao/playerCards");

async function handleSkip(game, card) {
    // change turn index
    return {}
}
async function handleReverse(game, card) {
    // change playerOrderReversed
    return {}
}
async function handlePlus2(game, card) {
    // add 2 cards to the player's deck
    return {}
}
async function handlePlus4Choose(game, card) {
    // change current color and add 4 to the player's deck
    console.log("GAME", game, "CARD", card);
    return {}
}
async function handleChoose(game, card) {
    // change current color
    return {}
}
async function handleSwap(game, card) {
    // swap cards
    return {}
}
async function handleNumber(game, player, card) {
    console.log("GAME", game, "CARD", card, "PLAYER", player);
    // const result1 = await PlayerCardsDao.removePlayerCard(card.id, player.id);
    // const result2 = await PlayedCardsDao.createPlayedCard(card.id, game.id);
    // if (!result1 || !result2) return { fail: true };

    return { card };
}
async function getNextTurn(game) {
    // let count = await PlayersDao.findPlayersCount(game.id);
    // let newTurnIndex;

    // if (count === -1) return;

    // if (game.playerOrderReversed) {
    //     if (game.turnIndex === 0) newTurnIndex = count - 1;
    //     else newTurnIndex = game.turnIndex - 1;
    // } else {
    //     if (game.turnIndex === count - 1) newTurnIndex = 0;
    //     else newTurnIndex = game.turnIndex + 1;
    // }


    console.log("REZZULTT", result);
}

async function emitBasedOnCardType(game, player, card, io) {

    let newData;
    if (card.special) {
        switch (card.value) {
            case "skip": { newData = await handleSkip(game, player, card); break; }
            case "reverse": { newData = await handleReverse(game, player, card); break; }
            case "plus2": { newData = await handlePlus2(game, player, card); break; }
            case "plus4choose": { newData = await handlePlus4Choose(game, player, card); break; }
            case "choose": { newData = await handleChoose(game, player, card); break; }
            case "swap": { newData = await handleSwap(game, player, card); break; }
            default: return;
        }
        if (newData.fail) return;
        io.to(`game/${game.id}`).emit(`play-card-${card.value}`, newData);
    } else {
        newData = await handleNumber(game, player, card);
        if (newData.fail) return;
        // await getNextTurn(game);

        io.to(`game/${game.id}`).emit('play-card-number', newData);
    }
}

module.exports = {
    emitBasedOnCardType
};