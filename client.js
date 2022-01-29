const ids = require('./id');
const Banchojs = require("bancho.js");
const client = new Banchojs.BanchoClient({ username: ids.username, password: ids.password, apiKey: ids.apikey });
var jokerBundle = require('./joker');
var maps = require('./mapLoading');
var jokers;
var mapset;
maps.then((maps) => mapset = maps[0]);;
client.connect().then(() => {
    console.log("We're online! Now listening for incoming messages.");
    jokers = compatibleMapWithJoker();
    client.on("PM", async (message) => {
        var command = message.message;

        //On PM, create the lobby
        //Lobby name is define given the two team name
        //Referee name is to allow referee to use commands
        if(command.startsWith("!createLobby")) {
            var args = command.substr(command.indexOf(' ')+1);
            if(args.length == 0) {
                message.user.sendMessage("Uses : !createLobby team1/team2/refereeName/commentator&streamer(optionnal)");
            } else {
                var  [team1, team2, refereeName] = args.split('/');

                var roomName = "("+ids.tourney_acronym+") ("+team1+") vs ("+team2+")";
                var room = client.createLobby(roomName);
                
                (await room).join();
                (await room).lobby.invitePlayer(refereeName);

                let mapCount = 0;

                /*
                    lobby.setSettings(teamMode, winCondition, size)
                    -> 2 : teamMode set as teamVS
                    -> 3 : winCondition set as scoreV2
                    -> 4 : lobby's size set as 4
                 */
                (await room).lobby.setSettings(2, 3, 4);

                var teamJokerState = initTeamJokerState();
                var mpJoker = loadJoker(jokers);

                //For every beatmap change, check if it's possible to use joker
                //If it is, ask to player if they want to use the random rolled joker 
                //until they use their joker
                (await room).lobby.on("beatmapId", async (beatmapId) => {

                    //to avoid unecessary errors because beatmapId can be null
                    if(beatmapId) {
                        var i = 0;
                        var beatmapInside = true;
                        while(mapset[i]['id'] != beatmapId) {
                            i++;
                            if(i == mapset.length) {
                                beatmapInside = false;
                                break;
                            }
                        }
                        
                        //
                        if(beatmapInside) {

                            //Getting the modpool
                            let mod = mapset[i]['mod']
                            
                            //specialCase means we want to know if this modpool is NM, FM or TB because there is a specific treatment
                            let specialCase = ['NM','FM','TB'].includes(mod);

                            //if there a specialCase then empty string, and if mod is FM or TB then set freemod to true
                            (await room).lobby.setMods(specialCase ? "" : mod, mod == 'FM' || mod == 'TB');
                            if(mapset[i]['mod'] != 'TB') {
                                
                                if(teamJokerState['blue'] && teamJokerState['red']) {

                                    let blueTeamJoker = rollJoker(mpJoker, beatmapId);
                                    let redTeamJoker = rollJoker(mpJoker, beatmapId);

                                    while(checkIfTeamHasSameJoker(blueTeamJoker, redTeamJoker)) {
                                        redTeamJoker = rollJoker(mpJoker, beatmapId);
                                    }

                                    (await room).sendMessage("Blue team : you can use "+blueTeamJoker['joker']);
                                    (await room).sendMessage("Red team : you can use "+redTeamJoker['joker']);

                                } else if(teamJokerState['blue'] && !teamJokerState['red']) {

                                    let blueTeamJoker = rollJoker(mpJoker, beatmapId);
                                    (await room).sendMessage("Blue Team : you can use "+blueTeamJoker['joker']);

                                } else if (!teamJokerState['blue'] && teamJokerState['red']) {

                                    let redTeamJoker = rollJoker(mpJoker, beatmapId);
                                    (await room).sendMessage("Red Team : you can use "+redTeamJoker['joker']);

                                }
                                mapset[i]['isPlayed'] = true;
                                mapCount+=1;
                            }
                        } else {
                            mapCount >= 2 ? (await room).sendMessage("Beatmap not in the mapset") : mapCount+=1;
                        }
                    }
                });

                //Check every message on the lobby channel in order to react to commands.
                (await room).on("message", async (message) =>{
                    var msg = message.message;
                    var messageAuthor = message.user.ircUsername;

                    //To know if joker are used or not
                    if(msg == "!joker") {
                        if(refereeName.valueOf() == messageAuthor.valueOf()) {
                            (await room).sendMessage(getTeamJokerState(teamJokerState));
                        } else {
                            (await room).sendMessage("You are not allowed to use commands");
                        }
                    }

                    //Use joker [jokerName] for the team [color] and update its joker state (false -> true)
                    if(msg.startsWith("!useJoker")) {
                        if(refereeName.valueOf() == messageAuthor.valueOf()) {
                            var args = msg.substr(msg.indexOf(' ')+1);
                            if(args.length == 0) {
                                (await room).sendMessage("Uses : !joker teamColor/joker");
                            } else {
                                var splittedArgs = args.split('/');
                                var [team, joker] = splittedArgs;
                                if(!teamJokerState[team]) {
                                    (await room).sendMessage(`No joker available for ${teamJokerState[team]}`)
                                } else {
                                    teamJokerState[team] = false;
                                    mpJoker[joker]['isUsed'] = true;
                                    
                                    switch(joker.toLowerCase()) {
                                        case 'purge du couard':
                                            (await room).lobby.setMods("");
                                            break;
                                        case 'téméraire':

                                            //Find all players from team TEAM
                                            let playersCouldBeRolled = new Array();
                                            (await room).lobby.slots.forEach((player) => {
                                                if (player.team == team) {
                                                    playersCouldBeRolled.push(player);
                                                }
                                            });

                                            //roll player
                                            let nbPlayer = playersCouldBeRolled.length;
                                            let roll = Math.floor(Math.random() * nbPlayer);
                                            let rolledPlayer = playersCouldBeRolled[roll];
                                            (await room).lobby.sendMessage(rolledPlayer.user.ircUsername + " has to pick a mod");
                                            break;
                                        default:
                                    }
                                }
                            }
                        } else {
                            (await room).sendMessage("You are not allowed to use commands");
                        }
                    }
                });   
            }
        }
    });
}).catch(console.error);

process.on("SIGINT", async () => {
    console.log("Client is disconnecting...");
    await client.disconnect();
});

function compatibleMapWithJoker() {
    let jokers = jokerBundle.initJoker;
    let sortedMapset = sortByMod(mapset);
    for(var i = 0 ; i < jokers.length ; i++) {

        if(jokers[i]['joker'] == 'Purge du Couard') {

            jokers[i]['compatibleMaps'] = jokers[i]['compatibleMaps'].concat(sortedMapset.HD, sortedMapset.HR);

        } else if(jokers[i]['joker'] == 'Téméraire') {

            jokers[i]['compatibleMaps'] = jokers[i]['compatibleMaps'].concat(sortedMapset.HR, sortedMapset.NM, sortedMapset.DT);

        } else {

            jokers[i]['compatibleMaps'] = jokers[i]['compatibleMaps'].concat(sortedMapset.NM, sortedMapset.HD, sortedMapset.HR, sortedMapset.DT, sortedMapset.FM, sortedMapset);
        }
    }
    return jokers;
}

function initTeamJokerState() {
    return {'blue': true, 'red': true};
}

function getTeamJokerState(teamJokerState) {
    const blueTeamJokerState = teamJokerState['blue'];
    const redTeamJokerState = teamJokerState['red'];

    if (!blueTeamJokerState && !redTeamJokerState) {

      return `Both teams are out of joker`;

    } else if(!blueTeamJokerState && redTeamJokerState) {

        return "Blue team : no joker available, Red team : Joker up"

    } else if(blueTeamJokerState && !redTeamJokerState) {

        return "Blue team : Joker up, Red team : no joker available"

    } else {

        return "Blue team : Joker up, Red team : Joker up"
    }
}

function sortByMod(mapset) {
    let sortedMapset = {NM : [], HD : [], HR: [], DT: [], FM: [], TB: []};
    for (var i = 0 ; i < mapset.length ; i++) {
        switch(mapset[i]['mod']) {
            case 'NM':
                sortedMapset.NM.push(mapset[i]);
                break;
            case 'HD':
                sortedMapset.HD.push(mapset[i]);
                break;
            case 'HR':
                sortedMapset.HR.push(mapset[i]);
                break;
            case 'DT':
                sortedMapset.DT.push(mapset[i]);
                break;
            case 'FM':
                sortedMapset.FM.push(mapset[i]);
                break;
            case 'TB':
                sortedMapset.TB.push(mapset[i]);
                break;
        }
    }
    return sortedMapset;
}

function rollJoker(mpJoker, beatmapId) {
    var compatible = false;
    var r = Math.floor(Math.random() * mpJoker.length);
    while(!compatible) {
        var found = mpJoker[r]['compatibleMaps'].find(element => element.id == beatmapId);
        if(found != undefined  || !mpJoker[r]['isUsed']) {
            compatible = true;
        } else {
            r = Math.floor(Math.random() * mpJoker.length);
        }
    }
    return jokers[r];
}

function loadJoker(mpJoker) {
    var _mpJoker = mpJoker;
    for(var i = 0 ; i<_mpJoker.length ; i++) {
        _mpJoker[i]['isUsed'] = false;
    }
    return _mpJoker;
}

function checkIfTeamHasSameJoker(blueTeamJoker, redTeamJoker) {
    return blueTeamJoker == redTeamJoker;
}