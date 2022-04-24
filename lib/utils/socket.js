const PlayedCardsDao = require("../../models/playedcard");

async function handleSkip(game, card) {

    return {}
}
async function handleReverse(game, card) {

    return {}
}
async function handlePlus2(game, card) {

    return {}
}
async function handlePlus4Choose(game, card) {

    return {}
}
async function handleChoose(game, card) {

    return {}
}
async function handleSwap(game, card) {

    return {}
}
async function handleNumber(game, card) {

    return {}
}

async function emitBasedOnCardType(game, card, io) {
    let newData;
    if (card.special) {
        switch (card.value) {
            case "skip": { newData = await handleSkip(game, card); break; }
            case "reverse": { newData = await handleReverse(game, card); break; }
            case "plus2": { newData = await handlePlus2(game, card); break; }
            case "plus4choose": { newData = await handlePlus4Choose(game, card); break; }
            case "choose": { newData = await handleChoose(game, card); break; }
            case "swap": { newData = await handleSwap(game, card); break; }
            default: return;
        }
        io.to(`game/${game.id}`).emit(`play-card-${card.value}`, newData);
    } else {
        newData = await handleNumber();
        io.to(`game/${game.id}`).emit('play-card-number', newData);
    }
}

module.exports = {
    emitBasedOnCardType
};