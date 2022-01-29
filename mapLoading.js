const fetch = require("node-fetch");
var maps = new Array;
async function loadMap() {
    let response = await fetch("http://localhost/databaseAccess/mapLoader.php")
    let text = await response.json();

    for(var i = 0 ; i<text.length ; i++) {
        maps.push(text[i]);
    }
    return maps;
}
module.exports = Promise.all([loadMap()]);