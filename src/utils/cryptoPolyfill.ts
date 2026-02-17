/**
 * Polyfill for crypto.getRandomValues in React Native.
 *
 * crypto-js reads `globalThis.crypto.getRandomValues` at module load time
 * to generate secure random bytes (salt/IV for AES).  React Native doesn't
 * expose the Web Crypto API, so we shim it using expo-crypto which is
 * already installed and provides a synchronous getRandomValues().
 *
 * This file MUST be imported before any module that touches crypto-js.
 */
import * as ExpoCrypto from 'expo-crypto';

// 1. Define the polyfill function
const polyfillGetRandomValues = function <T extends ArrayBufferView>(array: T): T {
    if (!array) {
        throw new Error('crypto.getRandomValues: array cannot be null or undefined');
    }
    // console.log('[CryptoPolyfill] Calling expo-crypto getRandomValues with array size:', array.byteLength);
    return ExpoCrypto.getRandomValues(array as any) as unknown as T;
};

// 2. Define the crypto object
const cryptoPolyfill = {
    getRandomValues: polyfillGetRandomValues,
    // Add other crypto methods here if needed in the future
};

// 3. Apply to ALL possible global scopes to ensure crypto-js finds it
const globalScopes = [
    typeof globalThis !== 'undefined' ? globalThis : undefined,
    typeof window !== 'undefined' ? window : undefined,
    typeof self !== 'undefined' ? self : undefined,
    typeof global !== 'undefined' ? global : undefined,
];

let appliedCount = 0;

globalScopes.forEach(scope => {
    if (!scope) return;

    if (!scope.crypto) {
        // @ts-ignore
        scope.crypto = {};
    }

    // @ts-ignore
    if (!scope.crypto.getRandomValues) {
        // @ts-ignore
        scope.crypto.getRandomValues = polyfillGetRandomValues;
        appliedCount++;
    } else {
        // Force overwrite just in case a bad shim exists
        // @ts-ignore
        scope.crypto.getRandomValues = polyfillGetRandomValues;
        appliedCount++;
    }
});


console.log(`[CryptoPolyfill] Polyfill applied to ${appliedCount} scopes. Crypto is ready.`);
