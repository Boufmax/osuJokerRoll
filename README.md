# osuJokerRoll
An osu! IRC bot (designed for osu!Random Tournament) in JavaScript using [Bancho.js](https://bancho.js.org) developed by [ThePooN](https://osu.ppy.sh/users/718454)

# Installation

## Requirements 

- [NodeJS](https://nodejs.org/en/)
- [PHP 7+](https://www.php.net/downloads)
- [MySQL](https://www.mysql.com/fr/downloads/)
- A IRC Client (like [HexChat](https://hexchat.github.io))

## Steps

- Setup your [osu!API](https://github.com/ppy/osu-api/wiki) key in a file called ``id.js``
- Fill up your file ``id.js`` as said in ``id_example.js``
- in the root folder ``npm i``
- launch php webserver with ``php -S localhost:YourPort``
- type ``node client.js`` and the bot starts

# Commands

### Private message with the bot

The only command available is ``createLobby``
- ``!createLobby team1/team2/refereeName/commentator&streamer(optionnal)``

### In the lobby

- ``!joker``, used only by the referee, tells if a team can use a joker or not
- ``!useJoker``, usage : ``!useJoker teamColor/joker``, used by a referee, use the ``joker`` of the team ``teamColor``

