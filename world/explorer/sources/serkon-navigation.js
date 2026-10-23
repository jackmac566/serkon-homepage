import * as THREE from 'three/webgpu'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const angle = v => Math.atan2(Math.sin(v), Math.cos(v))
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const DRIVING = new Set(['forward', 'backward', 'left', 'right', 'brake', 'boost', 'respawn', 'suspensions'])

// This controller only supplies the original Player's pedals and steering, between
// Player.updatePrePhysics (tick 1) and Rapier's vehicle controller (tick 2).
// It never writes a rigid body's translation, rotation, or linear velocity.
export function attachSerkonNavigation(game)
{
    const world = game.physics.world, R = game.RAPIER, player = game.player
    const vehicle = game.physicalVehicle, body = vehicle.chassis.physical.body
    const floorHandles = new Set(game.world.floor.physical.colliders.map(c => c.handle))
    const bridges = []
    // Only the original fixed bridges' wide deck is a support surface. Their
    // narrow railing colliders remain obstacles; water remains impassable.
    world.forEachCollider(collider =>
    {
        const parent = collider.parent(), name = parent?.userData?.object?.visual?.object3D?.name || ''
        if(!parent?.isFixed() || !/^bridge(?:\.|$)/i.test(name) || collider.shapeType() !== R.ShapeType.Cuboid) return
        const extent = collider.halfExtents(), rotation = collider.rotation()
        const upward = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation)
        if(extent.x < 1.8 || extent.z < 2 || upward.y < .98) return
        const position = collider.translation()
        floorHandles.add(collider.handle)
        bridges.push({ collider, position, rotation, inverse: new THREE.Quaternion().copy(rotation).invert(), extent })
    })
    const footprint = new R.Ball(1.65), identity = { x: 0, y: 0, z: 0, w: 1 }
    const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const bound = game.terrain.size / 2 - 4, step = 2.5
    let path = [], goal = null, active = false, brakeUntil = 0, command = 0, escape = null, planner = null, planningReentry = false
    let started = 0, lastProgress = 0, progressPosition = null, safetyClock = 0, replans = 0, lastSafety = 0
    let down = null, pointers = new Set(), pausedByHost = game.inputs.filters.has('host-paused')
    let routeFailure = ''

    const status = document.createElement('div')
    status.className = 'serkon-navigation-status'
    Object.assign(status.style, { position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', zIndex: '32', display: 'none', alignItems: 'center', gap: '14px', maxWidth: 'calc(100% - 32px)', padding: '10px 14px', background: '#142920e8', color: '#fff8e8', font: '12px/1.5 Arial,"PingFang SC",sans-serif', borderRadius: '4px' })
    const label = document.createElement('span'); label.setAttribute('role', 'status'); label.setAttribute('aria-live', 'polite')
    const stop = document.createElement('button'); stop.type = 'button'; stop.textContent = '停止'; stop.setAttribute('aria-label', '停止自动前往')
    Object.assign(stop.style, { border: '1px solid #e7efda80', background: 'transparent', color: 'inherit', font: 'inherit', padding: '5px 10px', cursor: 'pointer' })
    status.append(label, stop); document.body.append(status)
    const markerGeometry = new THREE.RingGeometry(.48, .61, 40)
    const markerMaterial = new THREE.MeshBasicNodeMaterial({ color: '#fff0b0', transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false })
    const marker = new THREE.Mesh(markerGeometry, markerMaterial); marker.rotation.x = -Math.PI / 2; marker.visible = false
    marker.userData.preventPreRender = true; game.scene.add(marker)
    let messageTimer
    function message(text, persistent = false)
    {
        clearTimeout(messageTimer); label.textContent = text; stop.hidden = !persistent; status.style.display = 'flex'
        if(!persistent) messageTimer = setTimeout(() => { status.style.display = 'none' }, 2600)
    }
    function allowed()
    {
        return !pausedByHost && !document.hidden && game.reveal.step >= 2 && player.state === 1 &&
            game.inputs.filters.has('wandering') && !game.inputs.filters.has('host-paused') &&
            game.modals.state === 3 && game.menu.state === 3 && !game.map?.active
    }
    function manual()
    {
        return [...DRIVING].some(name => game.inputs.actions.get(name)?.active) ||
            (game.inputs.nipple.active && game.inputs.nipple.progress > .03) ||
            game.inputs.gamepad.joysticks.left.active
    }
    function cancel(text = '', brake = true)
    {
        const wasActive = active || !!planner; active = false; planner = null; path = []; goal = null; escape = null; marker.visible = false; command++
        if(brake && wasActive) { player.accelerating = 0; player.steering = 0; player.boosting = 0; player.braking = 1; brakeUntil = game.ticker.elapsed + .7 }
        else if(!brake) brakeUntil = 0
        clearTimeout(messageTimer); status.style.display = 'none'
        if(text) message(text)
    }
    stop.addEventListener('click', () => cancel('已停止自动前往'))
    const obstacle = collider => !floorHandles.has(collider.handle) && !collider.isSensor() && collider.parent()?.handle !== body.handle &&
        (collider.collisionGroups() >>> 16) !== game.physics.groups.bumper
    function ground(x, z, diagnose = false)
    {
        if(Math.abs(x) > bound || Math.abs(z) > bound) { if(diagnose) routeFailure = `start-outside-terrain (${x.toFixed(2)},${z.toFixed(2)}; bound ${bound})`; return null }
        const ray = new R.Ray({ x, y: 50, z }, { x: 0, y: -1, z: 0 })
        const hit = world.castRayAndGetNormal(ray, 100, true, undefined, undefined, undefined, body, c => floorHandles.has(c.handle))
        if(!hit || hit.normal.y < .82) { if(diagnose) routeFailure = !hit ? `start-no-ground (floor colliders ${floorHandles.size})` : `start-ground-slope (${hit.normal.y.toFixed(3)})`; return null }
        const y = 50 - hit.timeOfImpact
        if(diagnose && y <= game.water.surfaceElevation + .10) routeFailure = `start-under-water (${y.toFixed(3)})`
        return y > game.water.surfaceElevation + .10 ? { x, y, z } : null
    }
    function free(x, z)
    {
        const p = ground(x, z)
        if(!p) return null
        const hit = world.intersectionWithShape({ x, y: p.y + 1.1, z }, identity, footprint, undefined, undefined, undefined, body, obstacle)
        return hit ? null : p
    }
    // A parked chassis can be outside an obstacle while its conservative 1.65m
    // navigation margin overlaps it. Permit a short exit from that margin only:
    // every original obstacle must get farther away, and no new one is ignored.
    function escapeFrom(start)
    {
        const center = { x: start.x, y: start.y + 1.1, z: start.z }, blockers = new Map()
        let valid = true
        world.intersectionsWithShape(center, identity, footprint, collider =>
        {
            const projection = collider.projectPoint(center, false)
            if(!projection || projection.isInside) { routeFailure = `start-inside-obstacle (handle ${collider.handle}; shape ${collider.shapeType()})`; valid = false; return false }
            const clearance = Math.hypot(center.x - projection.point.x, center.y - projection.point.y, center.z - projection.point.z)
            if(clearance < .6) { routeFailure = `start-obstacle-clearance (${clearance.toFixed(3)}m; handle ${collider.handle}; shape ${collider.shapeType()})`; valid = false; return false }
            blockers.set(collider.handle, clearance)
            return true
        }, undefined, undefined, undefined, body, obstacle)
        return valid && blockers.size ? { origin: start, blockers } : null
    }
    function exitPoint(x, z, context)
    {
        const p = ground(x, z)
        if(!p) return null
        const center = { x, y: p.y + 1.1, z }
        let valid = true
        world.intersectionsWithShape(center, identity, footprint, collider =>
        {
            const baseline = context?.blockers.get(collider.handle)
            if(baseline === undefined || distance(p, context.origin) > 6) { valid = false; return false }
            const projection = collider.projectPoint(center, false)
            if(!projection || projection.isInside || Math.hypot(x - projection.point.x, center.y - projection.point.y, z - projection.point.z) < baseline - .025) { valid = false; return false }
            return true
        }, undefined, undefined, undefined, body, obstacle)
        return valid ? p : null
    }
    function clearSegment(a, b, context = null)
    {
        const n = Math.max(1, Math.ceil(distance(a, b) / .85)); let last = ground(a.x, a.z)
        if(!last) return false
        let departing = !!context && !free(a.x, a.z)
        for(let i = 0; i <= n; i++)
        {
            const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
            const p = departing ? exitPoint(x, z, context) : free(x, z)
            if(!p || Math.abs(p.y - last.y) > .55) return false
            if(departing && free(x, z)) departing = false
            last = p
        }
        return true
    }
    function* plan(target)
    {
        routeFailure = ''
        const samples = new Map(), began = performance.now()
        let usedTime = 0
        let sliceStarted = began
        function* checkpoint()
        {
            const elapsed = performance.now() - sliceStarted
            if(elapsed > 4) { usedTime += elapsed; yield; sliceStarted = performance.now() }
        }
        function sample(x, z)
        {
            const key = `${x.toFixed(4)},${z.toFixed(4)}`
            if(!samples.has(key)) samples.set(key, free(x, z))
            return samples.get(key)
        }
        const start = ground(player.position.x, player.position.z, true)
        if(!start) return null
        const exit = sample(start.x, start.z) ? null : escapeFrom(start)
        if(!exit && !sample(start.x, start.z)) return null
        function* canTravel(a, b)
        {
            const n = Math.max(1, Math.ceil(distance(a, b) / .85))
            let last = ground(a.x, a.z), departing = !!exit && !sample(a.x, a.z)
            if(!last) return false
            for(let i = 0; i <= n; i++)
            {
                const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
                const p = departing ? exitPoint(x, z, exit) : sample(x, z)
                if(!p || Math.abs(p.y - last.y) > .55) return false
                if(departing && sample(x, z)) departing = false
                last = p
                yield* checkpoint()
            }
            return true
        }
        const finish = route => { route.escape = exit; return route }
        let end = sample(target.x, target.z)
        // Park alongside a narrow or newly occupied ground click rather than collide with it.
        if(!end) for(let ring = 1; ring <= 3 && !end; ring++) for(let i = 0; i < 16 && !end; i++)
        {
            end = sample(target.x + Math.cos(i / 16 * Math.PI * 2) * ring * 1.5, target.z + Math.sin(i / 16 * Math.PI * 2) * ring * 1.5)
            yield* checkpoint()
        }
        if(!end) { routeFailure = `target-no-free-ground (${target.x.toFixed(2)},${target.z.toFixed(2)})`; return null }
        if(yield* canTravel(start, end)) return finish([start, end])
        const nodes = new Map(), edges = new Map(), bridgeNodes = [], limit = Math.floor(bound / step)
        // A 2.5m square grid can completely miss a narrow, diagonal bridge.
        // Add its actual deck centerline to the same collision-checked graph.
        for(const bridge of bridges)
        {
            const length = bridge.extent.z + 2.5, count = Math.ceil(length * 2 / 1.25)
            for(let i = 0; i <= count; i++)
            {
                const offset = new THREE.Vector3(0, 0, -length + i / count * length * 2).applyQuaternion(bridge.rotation)
                const p = sample(bridge.position.x + offset.x, bridge.position.z + offset.z)
                if(p)
                {
                    const key = `bridge:${bridge.collider.handle}:${i}`
                    const n = { ...p, key, cost: Infinity, parent: null, bridge: true, access: Math.abs(-length + i / count * length * 2) > bridge.extent.z + .75 }
                    nodes.set(key, n); bridgeNodes.push(n)
                }
                yield* checkpoint()
            }
        }
        function node(ix, iz)
        {
            if(Math.abs(ix) > limit || Math.abs(iz) > limit) return null
            const key = `${ix},${iz}`
            if(!nodes.has(key)) { const p = sample(ix * step, iz * step); nodes.set(key, p ? { ...p, ix, iz, key, cost: Infinity, parent: null } : null) }
            return nodes.get(key)
        }
        function* nearest(p)
        {
            const candidates = [], ix = Math.round(p.x / step), iz = Math.round(p.z / step)
            for(let dx = -2; dx <= 2; dx++) for(let dz = -2; dz <= 2; dz++) { const n = node(ix + dx, iz + dz); if(n) candidates.push(n); yield* checkpoint() }
            for(const n of bridgeNodes) if(distance(n, p) < step * 3) candidates.push(n)
            candidates.sort((a, b) => distance(a, p) - distance(b, p))
            for(const candidate of candidates) if(yield* canTravel(p, candidate)) return candidate
            return null
        }
        const first = yield* nearest(start), last = yield* nearest(end)
        if(!first || !last) { routeFailure = `grid-${!first ? 'start' : 'target'}-unreachable (start ${start.x.toFixed(2)},${start.z.toFixed(2)}; exit blockers ${exit?.blockers.size || 0})`; return null }
        const open = [first], closed = new Set(); first.cost = 0; first.score = distance(first, last)
        for(let count = 0; open.length && count < 6000; count++)
        {
            // Yield collision-heavy searches between frames; elapsed rendering
            // time must never turn a perfectly open route into an unsafe one.
            if(usedTime + performance.now() - sliceStarted > 12000 || performance.now() - began > 60000) { routeFailure = `route-time-budget (expanded ${count}; queued ${open.length})`; return null }
            yield* checkpoint()
            let best = 0; for(let i = 1; i < open.length; i++) if(open[i].score < open[best].score) best = i
            const current = open.splice(best, 1)[0]
            if(closed.has(current.key)) continue
            if(current === last)
            {
                const raw = [end]; let n = last
                while(n) { raw.push(n); n = n.parent }
                raw.push(start); raw.reverse()
                const smooth = [start]; let index = 0
                while(index < raw.length - 1)
                {
                    let next = Math.min(raw.length - 1, index + 16)
                    // Keep bridge entry alignment and the centerline corridor.
                    // A geometrically visible shortcut can still be too sharp
                    // for a steered vehicle to turn through a narrow entrance.
                    if(raw[index].bridge) next = index + 1
                    else for(let k = index + 1; k < next; k++) if(raw[k].bridge) { next = k; break }
                    while(next > index + 1 && !(yield* canTravel(raw[index], raw[next]))) next--
                    smooth.push(raw[next]); index = next
                }
                return finish(smooth)
            }
            closed.add(current.key)
            const candidates = [], ix = current.bridge ? Math.round(current.x / step) : current.ix, iz = current.bridge ? Math.round(current.z / step) : current.iz
            const radius = current.bridge ? 2 : 1
            for(let dx = -radius; dx <= radius; dx++) for(let dz = -radius; dz <= radius; dz++)
            {
                if(current.bridge && !current.access) continue
                if(!dx && !dz && !current.bridge) continue
                const next = node(ix + dx, iz + dz)
                if(next) candidates.push(next)
                yield* checkpoint()
            }
            for(const next of bridgeNodes) if(next !== current && (current.bridge || next.access) && distance(next, current) < step * 2) candidates.push(next)
            for(const next of candidates)
            {
                if(!next || closed.has(next.key) || Math.abs(next.y - current.y) > .65) continue
                const edge = current.key < next.key ? `${current.key}/${next.key}` : `${next.key}/${current.key}`
                if(!edges.has(edge)) edges.set(edge, yield* canTravel(current, next))
                if(!edges.get(edge)) continue
                const cost = current.cost + distance(current, next)
                if(cost >= next.cost) continue
                next.parent = current; next.cost = cost; next.score = cost + distance(next, last)
                if(!open.includes(next)) open.push(next)
            }
        }
        routeFailure = `route-no-connection (visited ${closed.size}; nodes ${nodes.size})`
        return null
    }
    function navigateTo(target)
    {
        if(!allowed() || manual()) return false
        cancel('', false)
        goal = { ...target }; planningReentry = false; planner = plan(goal)
        status.setAttribute('data-route-start', JSON.stringify({ x: player.position.x, y: player.position.y, z: player.position.z }))
        status.setAttribute('data-route-target', JSON.stringify(target))
        status.setAttribute('data-route-result', 'planning'); message('正在确认路线…', true)
        return advancePlan()
    }
    function advancePlan()
    {
        const result = planner.next()
        if(!result.done) return true
        const found = result.value; planner = null
        status.setAttribute('data-route-result', found ? 'ok' : routeFailure || 'unknown')
        if(!found) { cancel('', true); message('这段路不够安全，请点击附近的开阔地面。'); return false }
        goal = found.at(-1); path = found.slice(1); escape = found.escape; active = true; started = lastProgress = game.ticker.elapsed
        lastSafety = -Infinity; progressPosition = player.position.clone(); if(!planningReentry) replans = 0; safetyClock = 0
        marker.position.set(goal.x, goal.y + .06, goal.z); marker.visible = true
        game.view.focusPoint.isTracking = true; message('正在开往你选择的空地', true)
        return true
    }
    function interactive()
    {
        for(const item of game.rayCursor.intersects)
        {
            if(!item.active) continue
            const shape = item.shape, ray = raycaster.ray
            if(shape.isMesh ? raycaster.intersectObject(shape, true).length : shape.isSphere ? ray.intersectsSphere(shape) : shape.isBox3 ? ray.intersectsBox(shape) : shape.isPlane ? ray.intersectsPlane(shape) : false) return true
        }
        return false
    }
    function pointAt(clientX, clientY)
    {
        const rect = game.canvasElement.getBoundingClientRect()
        ndc.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1)
        raycaster.setFromCamera(ndc, game.view.camera)
        if(interactive()) return null
        const ray = new R.Ray(raycaster.ray.origin, raycaster.ray.direction)
        const hit = world.castRayAndGetNormal(ray, 250, true, undefined, undefined, undefined, body, c => !c.isSensor())
        if(!hit || !floorHandles.has(hit.collider.handle)) return null
        const p = ray.pointAt(hit.timeOfImpact)
        return ground(p.x, p.z)
    }
    const canvas = game.canvasElement
    canvas.addEventListener('pointerdown', event =>
    {
        pointers.add(event.pointerId)
        if(active || planner) cancel('', true)
        if(pointers.size !== 1 || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !allowed()) { down = null; return }
        down = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), blocked: !pointAt(event.clientX, event.clientY), moved: false }
    })
    canvas.addEventListener('pointermove', event => { if(down && (event.pointerId !== down.id || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 9)) down.moved = true })
    window.addEventListener('pointerup', event =>
    {
        pointers.delete(event.pointerId)
        const click = down; down = null
        if(!click || event.pointerId !== click.id || click.blocked || click.moved || performance.now() - click.time > 500) return
        const token = command
        // Let the original mouse/touch release, RayCursor and modal handlers settle first.
        game.ticker.wait(2, () => { if(token !== command || !allowed() || manual()) return; const target = pointAt(event.clientX, event.clientY); if(target) navigateTo(target) })
    })
    window.addEventListener('pointercancel', event => { pointers.delete(event.pointerId); down = null })
    game.inputs.events.on('actionStart', action => { if(DRIVING.has(action.name)) cancel('', false) })
    const halt = () => { down = null; pointers.clear(); cancel('', true) }
    game.modals.events.on('open', halt); game.menu.events.on('open', halt)
    window.addEventListener('blur', halt); window.addEventListener('pagehide', halt)
    document.addEventListener('visibilitychange', () => { if(document.hidden) halt() })
    window.addEventListener('message', event =>
    {
        if(event.source !== window.parent || event.origin !== location.origin || event.data?.source !== 'serkon-host') return
        const data = event.data
        if(data.type === 'pause') { pausedByHost = true; halt() }
        else if(data.type === 'enter' || data.type === 'resume') pausedByHost = false
        else if(data.type === 'respawn' || (data.type === 'location' && (data.name || Number.isFinite(data.x)))) halt()
    })
    function update()
    {
        const now = game.ticker.elapsed
        if(!allowed()) { if(active || planner) cancel('', true); return }
        if(manual()) { if(active || planner) cancel('', false); return }
        if(planner) { player.accelerating = 0; player.braking = 1; advancePlan(); return }
        if(!active) { if(now < brakeUntil) { player.accelerating = 0; player.braking = 1 } return }
        const p = player.position, dt = game.ticker.delta, speed = vehicle.xzSpeed || 0
        if(now - started > 90 || vehicle.upward.y < .55) { cancel('已安全停止，请手动调整车辆。'); return }
        const remaining = distance(p, goal)
        if(remaining < 1.35) { cancel('到了。可以继续点击下一块空地。'); return }
        // Never cut an inside corner merely because its waypoint is nearby.
        if(escape && free(p.x, p.z)) escape = null
        while(path.length > 1 && distance(p, path[0]) < (path[0].bridge ? .9 : 2.8) && clearSegment(p, path[1], escape)) path.shift()
        let target = path[0]
        // Look through an approaching corner before reaching its exact vertex.
        // Starting the turn only at the vertex makes a car's real turning radius
        // overshoot the centerline and stop against a narrow bridge entrance.
        if(path.length > 1 && distance(p, target) < 3)
        {
            const next = path[1], length = distance(target, next)
            const blend = Math.min(1, (3 - distance(p, target)) / Math.max(.01, length))
            const ahead = { x: target.x + (next.x - target.x) * blend, y: target.y + (next.y - target.y) * blend, z: target.z + (next.z - target.z) * blend }
            if(clearSegment(p, ahead, escape)) target = ahead
        }
        const dx = target.x - p.x, dz = target.z - p.z
        const rawError = angle(Math.atan2(dz, dx) - Math.atan2(vehicle.forward.z, vehicle.forward.x))
        const reverse = Math.abs(rawError) > 2.0
        const error = angle(rawError - (reverse ? Math.PI : 0))
        const onBridgeApproach = bridges.some(bridge =>
        {
            const local = new THREE.Vector3(p.x - bridge.position.x, 0, p.z - bridge.position.z).applyQuaternion(bridge.inverse)
            return Math.abs(local.x) < bridge.extent.x + 1 && Math.abs(local.z) < bridge.extent.z + 3.5
        })
        const desiredSpeed = Math.min(reverse ? 2 : 4, onBridgeApproach ? 1.2 : 4, Math.max(.7, remaining * .8), Math.max(1, 4 - Math.abs(error) * 2.5))
        if(now - lastSafety > .25)
        {
            lastSafety = now
            const length = Math.hypot(dx, dz), look = Math.min(length, 2.6 + speed * .6)
            if(!clearSegment(p, { x: p.x + dx / length * look, y: p.y, z: p.z + dz / length * look }, escape)) safetyClock += .25
            else safetyClock = 0
        }
        if(distance(p, progressPosition) > .45) { lastProgress = now; progressPosition.copy(p) }
        if(safetyClock || now - lastProgress > 2.8)
        {
            player.accelerating = 0; player.braking = 1
            if(safetyClock >= .5 || now - lastProgress > 2.8)
            {
                if(replans++ >= 2) { cancel('前方暂时无法通行，已安全停车。'); return }
                planningReentry = true; planner = plan(goal); active = false
                message('正在重新确认前方路线…', true)
            }
            return
        }
        player.steering = (reverse ? 1 : -1) * clamp(error * 1.8, -1, 1)
        player.boosting = 0
        player.braking = speed > desiredSpeed + .5 ? .45 : 0
        player.accelerating = player.braking ? 0 : (reverse ? -1 : 1) * clamp(.20 + (desiredSpeed - speed) * .34, .08, .66)
    }
    game.ticker.events.on('tick', update, 1)
    const api = { navigateTo, cancel: () => cancel('已停止自动前往'), get active() { return active || !!planner }, get destination() { return goal && { x: goal.x, y: goal.y, z: goal.z } } }
    game.serkonNavigation = api
    return api
}
