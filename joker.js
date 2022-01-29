function initJoker() {
    let jokerNames = ['Purge du Couard', 'Téméraire', 'Power-up', 'Ticket Resto'];
    let jokers = jokerNames.map(name => {
        return {joker: name, compatibleMaps: [] }
    });

    return jokers;
}

module.exports = {
    initJoker: initJoker()
}
