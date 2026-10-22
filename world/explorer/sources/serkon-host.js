import { Howler } from 'howler'
import gsap from 'gsap'

const HOST_SOURCE = 'serkon-host'
const WORLD_SOURCE = 'serkon-explorer'
const LOCATION_LABELS = {
    achievements: '探索成就', altar: '山顶祭坛', behindTheScene: '幕后制作',
    bowling: '保龄球', career: '个人经历', circuit: '赛车场', cookie: '饼干工坊',
    lab: '实验室', landing: '出发点', projects: '作品广场', social: '联系我',
    timeMachine: '时光机'
}

export function isEmbedded()
{
    return new URLSearchParams(window.location.search).get('embed') === '1'
}

// The original engine lives in its own document, including its GSAP and Howler
// instances. This bridge never reaches into the parent DOM or shares renderers.
export function attachSerkonHost(game)
{
    if(!isEmbedded() || window.parent === window)
        return null

    const origin = window.location.origin
    const batches = new Map()
    let ready = false
    let wantsActive = false
    let active = false
    let pausedByHost = false
    let filtersBeforePause = null
    let pausedSounds = []
    let pendingDestination = null
    let started = false
    let moving = false

    const post = (type, details = {}) =>
    {
        window.parent.postMessage({ source: WORLD_SOURCE, type, ...details }, origin)
    }

    const error = (code, reason, requestId) =>
    {
        const message = reason instanceof Error ? reason.message : String(reason || 'World error')
        post('error', { code, message: message.slice(0, 500), ...(requestId !== undefined ? { requestId } : {}) })
    }

    const locations = () => [...(game.respawns?.items.values() || [])].map((item) => ({
        id: item.name,
        name: LOCATION_LABELS[item.name] || item.name,
        x: item.position.x,
        z: item.position.z
    }))

    const reportLocation = (requestId) =>
    {
        if(!game.player)
            return

        const { x, y, z } = game.player.position
        const nearest = game.respawns.getClosest(game.player.position)
        post('location', {
            x, y, z,
            position: { x, y, z },
            rotationY: game.player.rotationY,
            nearest: nearest?.name || null,
            started,
            mapTexture: game.dayCycles.intervalEvents.get('night').inInterval ? 'map-night.webp' : 'map-day.webp',
            music: { name: game.audio.playlist?.current?.name || '', playing: !!game.audio.playlist?.current?.sound.playing(), muted: !!game.audio.mute.active },
            ...(requestId !== undefined ? { requestId } : {})
        })
    }

    const releaseInputs = () =>
    {
        const inputs = game.inputs
        if(!inputs)
            return

        for(const action of inputs.actions.values())
        {
            for(const key of [...action.activeKeys])
                inputs.end(key)
            action.activeKeys.clear()
            action.active = false
            action.value = 0
        }
        inputs.keyboard.pressed = []

        const pointer = inputs.pointer
        pointer.isDown = false
        pointer.upcomingDown = false
        pointer.touches = []
        pointer.upcomingTouches = []
        pointer.delta.x = pointer.delta.y = 0
        Object.assign(pointer.upcoming, pointer.current)
        Object.assign(pointer.pinch, { ratio: 1, ratioDelta: 0, baseDistance: 0, distance: 0, distanceDelta: 0 })

        const nipple = inputs.nipple
        nipple.active = false
        nipple.progress = 0
        nipple.inRadiusLow = false
        nipple.group.visible = false
        nipple.uniforms.progress.value = 0

        if(game.player)
            for(const key of ['accelerating', 'steering', 'boosting', 'braking'])
                game.player[key] = 0

        if(document.pointerLockElement)
            document.exitPointerLock?.()
    }

    const audioInstances = () =>
    {
        const sounds = new Set()
        for(const group of game.audio?.groups.values() || [])
            for(const item of group.items)
                sounds.add(item.howl)
        for(const song of game.audio?.playlist?.songs || [])
            sounds.add(song.sound)
        return sounds
    }

    const silenceAudio = (remember = false) =>
    {
        if(remember)
            pausedSounds = []

        for(const howl of audioInstances())
        {
            // Preserve individual voice IDs so polyphonic effects are not
            // restarted at zero. Howler's public pause/play accept these IDs.
            for(const sound of howl._sounds || [])
            {
                const wasPlaying = howl.playing(sound._id)
                const blurredMusic = remember && game.audio?.playlist?.current?.sound === howl && !sound._ended
                if(remember && (wasPlaying || blurredMusic))
                    pausedSounds.push({ howl, id: sound._id })
                if(wasPlaying)
                    howl.pause(sound._id)
            }
        }
        Howler.mute(true)
    }

    const pause = () =>
    {
        active = false
        if(!ready || pausedByHost)
        {
            silenceAudio()
            return
        }

        releaseInputs()
        filtersBeforePause = game.inputs ? [...game.inputs.filters] : []
        game.inputs?.filters.clear()
        game.inputs?.filters.add('host-paused')
        game.rendering?.renderer?.setAnimationLoop(null)
        gsap.globalTimeline.pause()
        silenceAudio(true)
        pausedByHost = true
        document.activeElement?.blur?.()
        post('paused')
    }

    const resume = () =>
    {
        if(!ready || !wantsActive || document.hidden)
            return

        // A preloaded iframe may have been display:none without a resize event.
        if(game.viewport)
        {
            game.viewport.measure()
            game.viewport.events.trigger('change')
            game.viewport.events.trigger('throttleChange')
        }
        active = true
        if(pausedByHost)
        {
            game.inputs.filters.clear()
            for(const filter of filtersBeforePause || [])
                game.inputs.filters.add(filter)
            pausedByHost = false
            gsap.globalTimeline.resume()
            game.rendering.renderer.setAnimationLoop((elapsed) => game.ticker.update(elapsed))
            Howler.mute(!!game.audio.mute.active)
            if(game.audio.initiated)
            {
                for(const { howl, id } of pausedSounds)
                    if(!howl.playing(id))
                        howl.play(id)
                Howler.ctx?.resume?.()?.catch?.(() => {})
            }
            pausedSounds = []
        }
        else
            Howler.mute(!!game.audio.mute.active)

        post('resumed', { requiresInteraction: !game.audio.initiated })
        reportLocation()
    }

    const runDestination = () =>
    {
        if(!active || !started || !pendingDestination || moving)
            return

        const destination = pendingDestination
        pendingDestination = null
        moving = true
        releaseInputs()
        game.modals.close()
        game.overlay.show(() =>
        {
            const position = game.player.position.clone()
            let rotation = game.player.rotationY
            if(destination.name)
            {
                const respawn = game.respawns.getByName(destination.name)
                position.copy(respawn.position)
                rotation = respawn.rotation
            }
            else
            {
                position.set(destination.x, 32, destination.z)
                const ray = new game.RAPIER.Ray(position, { x: 0, y: -1, z: 0 })
                const hit = game.physics.world.castRay(ray, 96, true, undefined, undefined, undefined, game.physicalVehicle.chassis.physical.body)
                position.y = hit ? 32 - hit.timeOfImpact + 1.25 : 4
            }
            game.physicalVehicle.moveTo(position, rotation)
            game.player.position.copy(position)
            game.player.basePosition.copy(position)
            game.player.state = game.player.constructor.STATE_DEFAULT
            game.view.focusPoint.isTracking = true
            game.overlay.hide(() =>
            {
                moving = false
                reportLocation(destination.requestId)
                runDestination()
            })
        })
    }

    const setDestination = (data) =>
    {
        const name = data.name ?? data.id
        if(name !== undefined)
        {
            if(typeof name !== 'string' || !game.respawns?.items.has(name))
                return error('unknown-location', '这个目的地不存在。', data.requestId)
            pendingDestination = { name, requestId: data.requestId }
        }
        else
        {
            const x = data.x ?? data.position?.x
            const z = data.z ?? data.position?.z
            const limit = game.terrain?.size / 2
            if(typeof x !== 'number' || typeof z !== 'number' || !Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) >= limit || Math.abs(z) >= limit)
                return error('invalid-position', '目标坐标超出世界范围。', data.requestId)
            pendingDestination = { x, z, requestId: data.requestId }
        }
        runDestination()
    }

    const onMessage = (event) =>
    {
        if(event.source !== window.parent || event.origin !== origin || event.data?.source !== HOST_SOURCE)
            return

        const data = event.data
        switch(data.type)
        {
            case 'enter':
            case 'resume':
                wantsActive = true
                resume()
                if(data.type === 'enter')
                    game.canvasElement?.focus({ preventScroll: true })
                break
            case 'pause':
                wantsActive = false
                pause()
                break
            case 'respawn':
                if(!ready)
                    return error('not-ready', '世界仍在加载。', data.requestId)
                setDestination({ ...data, name: data.name ?? data.id ?? 'landing' })
                break
            case 'location':
                if(data.x !== undefined || data.position || data.name !== undefined || data.id !== undefined)
                {
                    if(!ready)
                        return error('not-ready', '世界仍在加载。', data.requestId)
                    setDestination(data)
                }
                else
                    reportLocation(data.requestId)
                break
            case 'music':
                if(ready && active && game.audio.initiated) {
                    if(data.action === 'next') game.audio.playlist.next();
                    else game.audio.mute.toggle();
                    if(!game.audio.mute.active && !game.audio.playlist.switching) {
                        Howler.mute(false);
                        if(game.audio.playlist.current && !game.audio.playlist.current.sound.playing()) game.audio.playlist.current.sound.play();
                        Howler.ctx?.resume?.()?.catch?.(()=>{});
                    }
                    reportLocation();
                }
                break
            case 'map':
                if(ready && active && started)
                    game.modals.open('map')
                break
            case 'menu':
                if(ready && active && started)
                    game.menu.open(typeof data.name === 'string' ? data.name : null)
                break
        }
    }

    const guardInput = (event) =>
    {
        if(!active)
        {
            if(event.cancelable)
                event.preventDefault()
            event.stopImmediatePropagation()
        }
        else if(event.type === 'keydown' && !event.repeat && started && game.inputs.filters.has('wandering') && !document.activeElement?.matches('input, textarea, [contenteditable]'))
        {
            if(event.code === 'Escape' && !game.world.whispers?.menu.inputFlag.isOpen && !game.world.areas?.circuit?.menu.inputFlag.isOpen)
            {
                event.preventDefault()
                event.stopImmediatePropagation()
                post('exit')
            }
        }
    }
    // Capture also blocks uncategorized global engine shortcuts while hidden.
    for(const type of ['keydown', 'keyup', 'mousedown', 'mouseup', 'mousemove', 'pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend', 'wheel', 'click'])
        window.addEventListener(type, guardInput, { capture: true, passive: false })

    window.addEventListener('message', onMessage)
    document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume())
    window.addEventListener('focus', () => { if(!active) silenceAudio() })
    window.addEventListener('pagehide', () => { wantsActive = false; pause() })
    window.addEventListener('error', (event) => error('runtime', event.error || event.message))
    window.addEventListener('unhandledrejection', (event) => error('runtime', event.reason))

    game.canvasElement.tabIndex = 0
    game.canvasElement.setAttribute('aria-label', 'Serkon 创作世界。进入后使用方向键或 W A S D 驾驶，Enter 开始。')
    game.host = {
        get active() { return active },
        progress(phase, loaded, total)
        {
            batches.set(phase, { loaded, total })
            const counts = [...batches.values()]
            post('progress', {
                phase,
                phaseLoaded: loaded,
                phaseTotal: total,
                loaded: counts.reduce((sum, batch) => sum + batch.loaded, 0),
                total: counts.reduce((sum, batch) => sum + batch.total, 0)
            })
        }
    }
    silenceAudio()

    game.readyPromise.then(() =>
    {
        ready = true
        game.ticker.events.on('tick', () =>
        {
            if(!started && game.reveal.step >= 2)
            {
                started = true
                post('started')
            }
            runDestination()
        }, 999)
        if(wantsActive && !document.hidden)
            resume()
        else
            pause()
        post('ready', {
            locations: locations(),
            terrainSize: game.terrain.size,
            backend: game.rendering.renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgl',
            requiresInteraction: !game.audio.initiated
        })
        reportLocation()
    }).catch((reason) =>
    {
        ready = true
        pause()
        error('initialization', reason)
    })

    const locationTimer = window.setInterval(() => { if(active && ready) reportLocation() }, 500)
    window.addEventListener('pagehide', () => window.clearInterval(locationTimer), { once: true })
    return game.host
}
