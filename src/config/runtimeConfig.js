import rawConfig from '../../config.json' with { type: 'json' };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const runtimeConfig = Object.freeze(clone(rawConfig));

export const metaConfig = runtimeConfig.meta;
export const storageConfig = runtimeConfig.storage;
export const automationConfig = runtimeConfig.automation;
export const dashboardConfig = runtimeConfig.dashboard || {};
export const firebaseConfig = runtimeConfig.firebase;
export const authConfig = runtimeConfig.auth;
export const seedConfig = runtimeConfig.seed;
export const validationConfig = runtimeConfig.validation;
export const exportConfig = runtimeConfig.exports;

export function getSeedUsers() {
  return clone(seedConfig.users || []);
}

export function getSeedEquipments() {
  return clone(seedConfig.equipments || []);
}

export function getSeedActivityTypes() {
  return clone(seedConfig.activityTypes || []);
}

export function getSeedShifts() {
  return clone(seedConfig.shifts || []);
}

export function getSeedPurchases() {
  return clone(seedConfig.purchases || []);
}
