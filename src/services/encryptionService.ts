/**
 * Encryption Service
 * Handles application-level encryption for sensitive data using AES-256.
 * The master key is stored securely in the device's SecureStore (Keychain/Keystore).
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const KEY_ALIAS = 'follo_master_key';

class EncryptionService {
    private masterKey: string | null = null;
    private isInitialized = false;

    /**
     * Initialize the encryption service
     * loads or generates the master key
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Try to load existing key
            let key = await SecureStore.getItemAsync(KEY_ALIAS);

            if (!key) {
                console.log('[EncryptionService] Generating new master key');
                // Generate 256-bit key (32 bytes)
                const randomBytes = await Crypto.getRandomBytesAsync(32);
                // Convert to hex string
                key = Array.from(randomBytes)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                await SecureStore.setItemAsync(KEY_ALIAS, key);
            }

            this.masterKey = key;
            this.isInitialized = true;
            console.log('[EncryptionService] Initialized successfully');
        } catch (error) {
            console.error('[EncryptionService] Initialization failed', error);
            throw new Error('Encryption service failed to initialize');
        }
    }

    /**
     * Encrypt a string value
     */
    encrypt(value: string): string {
        if (!this.isInitialized || !this.masterKey) {
            console.warn('[EncryptionService] Encrypt called before initialization');
            // Fallback or throw? For safety, return raw (bad) or throw. 
            // Throwing ensures we don't accidentally save unencrypted data thinking it's safe.
            throw new Error('EncryptionService not initialized');
        }

        try {
            return CryptoJS.AES.encrypt(value, this.masterKey).toString();
        } catch (error) {
            console.error('[EncryptionService] Encryption failed', error);
            throw error;
        }
    }

    /**
     * Decrypt a string value
     */
    decrypt(ciphertext: string): string {
        if (!this.isInitialized || !this.masterKey) {
            throw new Error('EncryptionService not initialized');
        }

        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, this.masterKey);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);

            if (!originalText && ciphertext) {
                // Check if it was empty string
                return '';
            }
            return originalText;
        } catch (error) {
            console.error('[EncryptionService] Decryption failed', error);
            // Return original if decryption fails (might be unencrypted legacy data)
            return ciphertext;
        }
    }
}

export const encryptionService = new EncryptionService();
