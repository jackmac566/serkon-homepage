import './threejs-override.js'
import { Game } from './Game/Game.js'
import consoleLog from './data/consoleLog.js'
import { attachSerkonHost, isEmbedded } from './serkon-host.js'
import { attachSerkonNavigation } from './serkon-navigation.js'

const embedded = isEmbedded()

if(!embedded && import.meta.env.VITE_LOG)
    console.log(
        ...consoleLog
    )

const game = new Game()

if(embedded)
    attachSerkonHost(game)
else
{
    if(import.meta.env.VITE_GAME_PUBLIC)
        window.game = game

    game.readyPromise.catch((error) => console.error('World initialization failed', error))
}

game.readyPromise.then(() => attachSerkonNavigation(game)).catch(error => console.error('Navigation initialization failed', error))
