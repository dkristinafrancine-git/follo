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

if (typeof globalThis.crypto === 'undefined') {
    // @ts-ignore – intentional partial shim
    globalThis.crypto = {};
}

if (typeof globalThis.crypto === 'undefined') {
    // @ts-ignore – intentional partial shim
    globalThis.crypto = {};
}

// Force overwrite to ensure we use expo-crypto, even if something else shimmed it brokenly
// @ts-ignore
globalThis.crypto.getRandomValues = function <T extends ArrayBufferView>(array: T): T {
    // console.log('[CryptoPolyfill] Calling expo-crypto getRandomValues'); // Uncomment for deep debug
    return ExpoCrypto.getRandomValues(array as any) as unknown as T;
};

console.log('[CryptoPolyfill] Polyfill applied successfully, forcing ExpoCrypto');
