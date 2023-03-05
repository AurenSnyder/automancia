## WHAT IS THIS?

Automanica is a companion app to Cincomancia and Cinco Paus. It seeks to automate much of the labor (though not all) of entering data into Cincomancia. In addition to this, it also:

* displays the frog timer
* displays parity with the incoming frog at both entrance and exit
* displays enemy parity (via the presence or absence of a green dot on enemies)
* displays which wand effect the wizard is standing on
* if you have five keys, it will track which walls you've checked for the secret exit and the location of the secret exit if you've found it

## INSTALLATION

1) place index.html, engine.js and the cincomancia folder into the same directory as Cinco Paus.exe
2) cd into the same directory as Cinco Paus.exe
3) python -m http.server
4) navigate to http://localhost:8000/

## HOW TO USE

move around in cinco paus. pause after each move to let automancia catch up. it will (mostly) automatically track the game state.

after using a wand, you will need to specify which direction you fired it.

if you use a wand to refresh itself, automancia won't detect it. sorry about that :/

this is an experimental build, please expect some bugs and don't 100% rely on it if you're doing a serious run. if you find a bug, message me (Auren#3201) about it in the cinco paus discord! thanks!
