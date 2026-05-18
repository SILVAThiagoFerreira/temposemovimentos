import assert from 'node:assert/strict';
import { formatGpsCoordinates, normalizeGpsSnapshot, projectGpsPoints } from '../src/services/locationService.js';

const snapshot = normalizeGpsSnapshot({
  latitude: -6.91234567,
  longitude: -38.12345678,
  accuracyMeters: 12.8,
  capturedAt: '2026-05-17T12:00:00Z',
  source: 'browser-geolocation',
});

assert.equal(snapshot.latitude, -6.912346, 'latitude deve ser normalizada');
assert.equal(snapshot.longitude, -38.123457, 'longitude deve ser normalizada');
assert.equal(snapshot.accuracyMeters, 13, 'precisão deve ser arredondada');
assert.equal(snapshot.capturedAt, '2026-05-17T12:00:00.000Z', 'timestamp deve virar ISO');

const projected = projectGpsPoints([
  snapshot,
  {
    latitude: -6.902345,
    longitude: -38.113456,
  },
], {
  padding: 10,
  locale: 'pt-BR',
});

assert.equal(projected.markers.length, 2, 'devem existir dois marcadores projetados');
assert.notEqual(projected.markers[0].x, projected.markers[1].x, 'os marcadores não podem colidir no eixo X');
assert.notEqual(projected.markers[0].y, projected.markers[1].y, 'os marcadores não podem colidir no eixo Y');
assert.ok(projected.mapUrl.includes('ll='), 'a URL deve centralizar o mapa');
assert.ok(projected.mapUrl.includes('t=k'), 'a URL deve usar satélite do Google Maps');
assert.ok(projected.mapUrl.includes('output=embed'), 'a URL deve ser própria para iframe');

const single = projectGpsPoints([snapshot], { padding: 10 });

assert.equal(single.markers[0].x, 50, 'um único ponto deve ficar centralizado no eixo X');
assert.equal(single.markers[0].y, 50, 'um único ponto deve ficar centralizado no eixo Y');
assert.ok(Number.isInteger(single.zoom) && single.zoom >= 11, 'o zoom deve ser válido');
assert.equal(typeof formatGpsCoordinates(snapshot, 'pt-BR'), 'string', 'a formatação deve retornar texto');

console.log('LOCATION_SERVICE_OK');
