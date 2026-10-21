/** Small deterministic, browser-independent driving and route controller. */
export function createDriver({ colliders = [], bounds = 26.3, vehicleRadius = .9 } = {}) {
  const radius = Math.max(.2,Number.isFinite(vehicleRadius)?vehicleRadius:.9), clearance = .08, step = 2;
  const obstacles = colliders.filter(item => Number.isFinite(item.x) && Number.isFinite(item.z) && item.r > 0);
  const state = { x: 0, z: 9, y: 0, yaw: 0, speed: 0, steer: 0, travelId: null };
  let route = [], routeIndex = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const angle = value => Math.atan2(Math.sin(value), Math.cos(value));
  const free = (x, z, extra = 0) => Math.abs(x) <= bounds && Math.abs(z) <= bounds && obstacles.every(item => Math.hypot(x - item.x, z - item.z) >= item.r + radius + extra);
  function clearSegment(a, b, extra = clearance) {
    const length = Math.hypot(b.x - a.x, b.z - a.z), samples = Math.max(1, Math.ceil(length / .3));
    for (let i = 0; i <= samples; i++) { const t = i / samples; const padding = extra * Math.min(1, t * length / .5, (1 - t) * length / .5); if (!free(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, padding)) return false; }
    return true;
  }
  function findPath(targetX, targetZ) {
    const start = { x: state.x, z: state.z }, target = { x: targetX, z: targetZ };
    if (!free(targetX, targetZ, clearance)) return null;
    if (clearSegment(start, target)) return [start, target];
    const limit = Math.floor(bounds / step), nodes = [];
    for (let iz = -limit; iz <= limit; iz++) for (let ix = -limit; ix <= limit; ix++) {
      const x = ix * step, z = iz * step;
      if (free(x, z, clearance)) nodes.push({ x, z, ix, iz, key: `${ix},${iz}` });
    }
    const byKey = new Map(nodes.map(node => [node.key, node]));
    const nearest = point => [...nodes].sort((a, b) => Math.hypot(a.x-point.x,a.z-point.z) - Math.hypot(b.x-point.x,b.z-point.z)).find(node => clearSegment(point, node));
    const first = nearest(start), last = nearest(target); if (!first || !last) return null;
    const open = new Set([first.key]), costs = new Map([[first.key, 0]]), parents = new Map();
    const heuristic = node => Math.hypot(node.x - last.x, node.z - last.z);
    while (open.size) {
      let currentKey = null, best = Infinity;
      for (const key of open) { const score = costs.get(key) + heuristic(byKey.get(key)); if (score < best) { best = score; currentKey = key; } }
      const current = byKey.get(currentKey); open.delete(currentKey);
      if (currentKey === last.key) {
        const raw = [target]; let key = last.key;
        while (key) { const node = byKey.get(key); raw.push({ x: node.x, z: node.z }); key = parents.get(key); }
        raw.push(start); raw.reverse();
        // Keep only corners needed to avoid obstacles, instead of a zig-zag grid ride.
        const smooth = [raw[0]]; let index = 0;
        while (index < raw.length - 1) { let next = raw.length - 1; while (next > index + 1 && !clearSegment(raw[index], raw[next])) next--; smooth.push(raw[next]); index = next; }
        return smooth;
      }
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const next = byKey.get(`${current.ix + dx},${current.iz + dz}`);
        if (!next || !clearSegment(current, next)) continue;
        const cost = costs.get(currentKey) + Math.hypot(dx, dz) * step;
        if (cost < (costs.get(next.key) ?? Infinity)) { costs.set(next.key, cost); parents.set(next.key, currentKey); open.add(next.key); }
      }
    }
    return null;
  }
  function cancelTravel() { state.travelId = null; route = []; routeIndex = 0; }
  function followPath(id, found) {
    route = found; routeIndex = route.length > 1 ? 1 : 0; state.travelId = id; state.speed = 0; return true;
  }
  function travel(id, x, z) {
    if (!id || !Number.isFinite(x) || !Number.isFinite(z)) return false;
    const found = findPath(x, z); if (!found) { cancelTravel(); return false; }
    return followPath(id, found);
  }
  /** Drive to bare ground. An occupied click stops at a safe point beside it. */
  function travelToPoint(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    const target = { x: clamp(x, -bounds, bounds), z: clamp(z, -bounds, bounds) };
    if (free(target.x, target.z, clearance)) {
      const found = findPath(target.x, target.z);
      if (found) return followPath('ground', found);
      cancelTravel(); return false;
    }
    // Keep precise parking positions around circular obstacles, then use the
    // same dynamically sized grid as route search when nearby circles overlap.
    const candidates = [];
    for (const item of obstacles) {
      const parkingRadius = item.r + radius + clearance + .005;
      if (Math.hypot(target.x - item.x, target.z - item.z) > parkingRadius + 4) continue;
      const vx = target.x - item.x, vz = target.z - item.z;
      const base = Math.hypot(vx, vz) > .0001 ? Math.atan2(vz, vx) : Math.atan2(state.z - item.z, state.x - item.x);
      for (let i = 0; i < 32; i++) {
        const a = base + i * Math.PI / 16;
        const point = { x: item.x + Math.cos(a) * parkingRadius, z: item.z + Math.sin(a) * parkingRadius };
        if (free(point.x, point.z, clearance)) candidates.push(point);
      }
    }
    const limit = Math.floor(bounds / step);
    for (let iz = -limit; iz <= limit; iz++) for (let ix = -limit; ix <= limit; ix++) {
      const point = { x: ix * step, z: iz * step };
      if (free(point.x, point.z, clearance)) candidates.push(point);
    }
    candidates.sort((a, b) => {
      const distance = Math.hypot(a.x - target.x, a.z - target.z) - Math.hypot(b.x - target.x, b.z - target.z);
      return Math.abs(distance) > .00001 ? distance : Math.hypot(a.x - state.x, a.z - state.z) - Math.hypot(b.x - state.x, b.z - state.z);
    });
    // A sealed or otherwise unreachable region fails without creating a route.
    // Bound expensive path attempts rather than searching every parking point.
    for (const point of candidates.slice(0, 16)) {
      const found = findPath(point.x, point.z);
      if (found) return followPath('ground', found);
    }
    cancelTravel(); return false;
  }
  function reset() { cancelTravel(); Object.assign(state, { x: 0, z: 9, y: 0, yaw: 0, speed: 0, steer: 0 }); }
  function move(dx, dz) {
    let x = clamp(state.x + dx, -bounds, bounds), z = clamp(state.z + dz, -bounds, bounds), collision = x !== state.x + dx || z !== state.z + dz;
    for (let pass = 0; pass < 3; pass++) for (const item of obstacles) {
      const vx = x - item.x, vz = z - item.z, distance = Math.hypot(vx, vz), minimum = item.r + radius;
      if (distance < minimum) {
        const fallback = Math.hypot(state.x - item.x, state.z - item.z) || 1;
        const nx = distance > .0001 ? vx / distance : (state.x - item.x) / fallback;
        const nz = distance > .0001 ? vz / distance : (state.z - item.z) / fallback;
        x = item.x + nx * (minimum + .0001); z = item.z + nz * (minimum + .0001); collision = true;
      }
    }
    state.x = clamp(x, -bounds, bounds); state.z = clamp(z, -bounds, bounds);
    return collision;
  }
  function update(delta, input = {}, enabled = true) {
    const dt = clamp(Number.isFinite(delta) ? delta : 0, 0, .1);
    if (!enabled || !dt) return {};
    const throttle = clamp(Number(input.throttle) || 0, -1, 1), steering = clamp(Number(input.steer) || 0, -1, 1), braking = Boolean(input.brake);
    if (state.travelId && (Math.abs(throttle) > .08 || Math.abs(steering) > .08 || braking)) cancelTravel();
    let collision = false, arrived;
    const substeps = Math.max(1, Math.ceil(dt / .0125)), h = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      if (state.travelId) {
        const point = route[routeIndex];
        if (!point) { cancelTravel(); break; }
        const dx = point.x - state.x, dz = point.z - state.z, distance = Math.hypot(dx, dz), final = routeIndex === route.length - 1;
        if (distance < (final ? .24 : .28)) {
          if (final) { state.x = point.x; state.z = point.z; state.speed = 0; state.steer = 0; arrived = state.travelId; cancelTravel(); break; }
          routeIndex++; continue;
        }
        const desiredYaw = Math.atan2(-dx, -dz), turn = angle(desiredYaw - state.yaw);
        state.yaw = angle(state.yaw + clamp(turn, -5 * h, 5 * h)); state.steer = clamp(turn, -1, 1);
        const targetSpeed = Math.min(9, Math.max(1.7, distance * 2.8)) * (Math.abs(turn) > 1 ? .6 : 1);
        state.speed += clamp(targetSpeed - state.speed, -17 * h, 10 * h);
        const travelDistance = Math.min(distance, state.speed * h);
        collision = move(dx / distance * travelDistance, dz / distance * travelDistance) || collision;
      } else {
        state.steer += (steering - state.steer) * Math.min(1, h * 10);
        if (braking) state.speed *= Math.exp(-h * 12);
        else if (Math.abs(throttle) > .03) { state.speed += throttle * (state.speed * throttle < 0 ? 19 : 11) * h; state.speed *= Math.exp(-h * .15); }
        else { state.speed *= Math.exp(-h * 1.6); if (Math.abs(state.speed) < .015) state.speed = 0; }
        state.speed = clamp(state.speed, -4.2, 10.5);
        state.yaw = angle(state.yaw + state.steer * state.speed * .30 * h);
        const hit = move(-Math.sin(state.yaw) * state.speed * h, -Math.cos(state.yaw) * state.speed * h);
        if (hit) { collision = true; state.speed *= .65; }
      }
    }
    return { ...(arrived ? { arrived } : {}), ...(collision ? { collision: true } : {}) };
  }
  return { state, update, travel, travelToPoint, cancelTravel, reset, get path() { return route.slice(routeIndex > 0 ? routeIndex - 1 : 0); } };
}
