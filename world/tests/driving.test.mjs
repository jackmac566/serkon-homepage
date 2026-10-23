import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriver } from '../src/driving.js';
import { stations } from '../src/content.js';
const tick = (driver, seconds, input) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) driver.update(1/60, input); };

test('forward/reverse controls move in the displayed vehicle orientation', () => {
  const driver = createDriver(); tick(driver, 1, { throttle: 1 }); assert.ok(driver.state.z < 5); assert.equal(driver.state.x, 0);
  driver.reset(); tick(driver, 1, { throttle: -1 }); assert.ok(driver.state.z > 11);
  driver.reset(); tick(driver, 1.2, { throttle: 1, steer: 1 }); assert.ok(driver.state.x < -1); assert.ok(driver.state.yaw > 0);
});
test('braking and paused updates do not keep driving behind content', () => {
  const driver = createDriver(); tick(driver, .6, { throttle: 1 }); tick(driver, .5, { brake: true }); assert.ok(Math.abs(driver.state.speed) < .03);
  const before = { ...driver.state }; driver.update(1, { throttle: 1 }, false); assert.deepEqual(driver.state, before);
});
test('large frame gaps stay bounded and a small obstacle cannot be tunnelled through', () => {
  const driver = createDriver({ colliders: [{ x: 0, z: 5, r: .2 }] }); driver.state.speed = 10;
  driver.update(999, { throttle: 1 }); assert.ok(driver.state.z > 7.8);
  tick(driver, 3, { throttle: 1 }); assert.ok(driver.state.z >= 6.099); assert.ok(Math.hypot(driver.state.x, driver.state.z - 5) >= 1.099);
  const edge = createDriver({ bounds: 12 }); tick(edge, 10, { throttle: -1 }); assert.ok(edge.state.z <= 12);
});
test('autopilot routes around a wall and emits arrival only once', () => {
  const obstacles = [{ x: 0, z: 0, r: 3 }, { x: -4, z: 0, r: 1 }];
  const driver = createDriver({ colliders: obstacles }); assert.equal(driver.travel('goal', 0, -10), true); assert.ok(driver.path.some(point => Math.abs(point.x) > 3));
  let arrivals = 0;
  for (let i=0; i<1800; i++) { const result=driver.update(1/60,{}); if(result.arrived)arrivals++; for(const obstacle of obstacles)assert.ok(Math.hypot(driver.state.x-obstacle.x,driver.state.z-obstacle.z)>=obstacle.r+.899); }
  assert.equal(arrivals,1);assert.equal(driver.state.travelId,null);assert.ok(Math.hypot(driver.state.x,driver.state.z+10)<.25);
});
test('five destination parking points can be reached around their buildings', () => {
  const colliders = stations.map(station => ({ x: station.x, z: station.z, r: station.id === 'about' ? 3.1 : 4.05 }));
  for(const station of stations){ const driver=createDriver({colliders});assert.equal(driver.travel(station.id,station.stopX,station.stopZ),true,station.id);let arrived;for(let i=0;i<1800&&!arrived;i++)arrived=driver.update(1/60,{}).arrived;assert.equal(arrived,station.id);assert.ok(Math.hypot(driver.state.x-station.stopX,driver.state.z-station.stopZ)<.25); }
});
test('manual input cancels travel, reset clears momentum, and blocked goals fail safely', () => {
  const driver=createDriver({colliders:[{x:8,z:8,r:2}]});assert.equal(driver.travel('blocked',8,8),false);assert.equal(driver.travel('valid',0,-10),true);driver.update(1/60,{throttle:1});assert.equal(driver.state.travelId,null);assert.deepEqual(driver.path,[]);driver.reset();assert.equal(driver.state.z,9);assert.equal(driver.state.speed,0);assert.equal(driver.state.steer,0);assert.equal(driver.state.yaw,0);
});

test('autopilot can leave a wall after a manual collision', () => {
  const driver=createDriver({colliders:[{x:0,z:5,r:.2}]});
  tick(driver,2,{throttle:1}); assert.equal(driver.travel('other-side',0,-8),true);
  let arrived; for(let i=0;i<1800&&!arrived;i++)arrived=driver.update(1/60,{}).arrived;
  assert.equal(arrived,'other-side');
});

test('a bare-ground destination is reached exactly and emits a ground arrival once', () => {
  const driver = createDriver();
  assert.equal(driver.travelToPoint(13.25, 4.65), true);
  assert.equal(driver.state.travelId, 'ground');
  let arrivals = 0;
  for (let i = 0; i < 900; i++) if (driver.update(1 / 60, {}).arrived === 'ground') arrivals++;
  assert.equal(arrivals, 1);
  assert.ok(Math.hypot(driver.state.x - 13.25, driver.state.z - 4.65) < .01);
  assert.deepEqual(driver.path, []);
});

test('clicking an occupied point parks beside the obstacle instead of inside it', () => {
  const colliders = [{ x: 12, z: 8, r: 3 }, { x: 15, z: 8, r: 3 }];
  const driver = createDriver({ colliders });
  assert.equal(driver.travelToPoint(13.5, 8), true);
  const parkingPoint = driver.path.at(-1);
  for (const obstacle of colliders) assert.ok(Math.hypot(parkingPoint.x - obstacle.x, parkingPoint.z - obstacle.z) >= obstacle.r + .98);
  let arrived;
  for (let i = 0; i < 1800 && !arrived; i++) {
    arrived = driver.update(1 / 60, {}).arrived;
    for (const obstacle of colliders) assert.ok(Math.hypot(driver.state.x - obstacle.x, driver.state.z - obstacle.z) >= obstacle.r + .899);
  }
  assert.equal(arrived, 'ground');
  assert.ok(Math.hypot(driver.state.x - parkingPoint.x, driver.state.z - parkingPoint.z) < .01);
});

test('a 44-unit world routes beyond the former 26-unit boundary around a wide wall', () => {
  const colliders = [-24, -16, -8, 0, 8, 16, 24].map(x => ({ x, z: 0, r: 5.2 }));
  const driver = createDriver({ colliders, bounds: 44 });
  assert.equal(driver.travelToPoint(0, -35), true);
  assert.ok(driver.path.some(point => Math.abs(point.x) > 30));
  let arrived;
  for (let i = 0; i < 3600 && !arrived; i++) {
    arrived = driver.update(1 / 60, {}).arrived;
    assert.ok(Math.abs(driver.state.x) <= 44 && Math.abs(driver.state.z) <= 44);
  }
  assert.equal(arrived, 'ground');
  assert.ok(Math.hypot(driver.state.x, driver.state.z + 35) < .01);
});

test('ground requests clamp to the world edge and reject non-finite or wholly blocked targets', () => {
  const driver = createDriver({ bounds: 44 });
  assert.equal(driver.travelToPoint(NaN, 0), false);
  assert.equal(driver.travelToPoint(0, Infinity), false);
  assert.equal(driver.travelToPoint(999, -999), true);
  assert.deepEqual(driver.path.at(-1), { x: 44, z: -44 });
  let arrived;
  for (let i = 0; i < 1800 && !arrived; i++) arrived = driver.update(1 / 60, {}).arrived;
  assert.equal(arrived, 'ground');
  assert.equal(driver.state.x, 44); assert.equal(driver.state.z, -44);
  const blocked = createDriver({ bounds: 44, colliders: [{ x: 0, z: 0, r: 100 }] });
  assert.equal(blocked.travelToPoint(4, 5), false);
  assert.equal(blocked.state.travelId, null); assert.deepEqual(blocked.path, []);
});

test('manual control cancels ground travel and pausing retains its destination without motion', () => {
  const driver = createDriver();
  assert.equal(driver.travelToPoint(18, -14), true);
  const before = { ...driver.state }, path = driver.path;
  driver.update(.1, { throttle: 1 }, false);
  assert.deepEqual(driver.state, before); assert.deepEqual(driver.path, path);
  driver.update(1 / 60, { brake: true });
  assert.equal(driver.state.travelId, null); assert.deepEqual(driver.path, []);
  assert.equal(driver.travelToPoint(-18, 14), true);
  driver.update(1 / 60, { steer: 1 });
  assert.equal(driver.state.travelId, null); assert.deepEqual(driver.path, []);
});
