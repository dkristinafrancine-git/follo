import { create } from 'zustand';
import { Profile } from '../types';
import { profileRepository } from '../repositories';

interface ProfileStore {
    // State
    profiles: Profile[];
    activeProfileId: string | null;
    isLoading: boolean;
    error: string | null;
    hasCompletedOnboarding: boolean;

    // Computed
    activeProfile: Profile | null;

    // Actions
    loadProfiles: () => Promise<void>;
    setActiveProfile: (profileId: string) => Promise<void>;
    createProfile: (name: string, birthDate?: string) => Promise<Profile>;
    updateProfile: (id: string, name: string, birthDate?: string) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
    completeOnboarding: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
    // Initial state
    profiles: [],
    activeProfileId: null,
    isLoading: true,
    error: null,
    hasCompletedOnboarding: false,

    // Computed getter
    get activeProfile() {
        const state = get();
        return state.profiles.find(p => p.id === state.activeProfileId) ?? null;
    },

    // Load all profiles from database
    loadProfiles: async () => {
        try {
            set({ isLoading: true, error: null });
            const profiles = await profileRepository.getAll();

            // Find primary profile or first profile
            const primary = profiles.find(p => p.isPrimary) ?? profiles[0] ?? null;

            set({
                profiles,
                activeProfileId: primary?.id ?? null,
                isLoading: false,
                hasCompletedOnboarding: profiles.length > 0,
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load profiles',
            });
        }
    },

    // Set active profile
    setActiveProfile: async (profileId: string) => {
        const profile = get().profiles.find(p => p.id === profileId);
        if (profile) {
            set({ activeProfileId: profileId });
            // Also set as primary in database for persistence
            await profileRepository.setPrimary(profileId);
        }
    },

    // Create a new profile
    createProfile: async (name: string, birthDate?: string) => {
        try {
            set({ error: null });
            const isFirst = get().profiles.length === 0;

            const newProfile = await profileRepository.create({
                name,
                birthDate,
                isPrimary: isFirst,
            });

            set(state => ({
                profiles: [...state.profiles, newProfile],
                activeProfileId: isFirst ? newProfile.id : state.activeProfileId,
                hasCompletedOnboarding: true,
            }));

            return newProfile;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create profile' });
            throw error;
        }
    },

    // Update a profile
    updateProfile: async (id: string, name: string, birthDate?: string) => {
        try {
            set({ error: null });
            const updated = await profileRepository.update(id, { name, birthDate });

            if (updated) {
                set(state => ({
                    profiles: state.profiles.map(p => p.id === id ? updated : p),
                }));
            }
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update profile' });
            throw error;
        }
    },

    // Delete a profile
    deleteProfile: async (id: string) => {
        try {
            set({ error: null });
            const deleted = await profileRepository.delete(id);

            if (deleted) {
                const newProfiles = get().profiles.filter(p => p.id !== id);
                const newActive = newProfiles.find(p => p.isPrimary) ?? newProfiles[0] ?? null;

                set({
                    profiles: newProfiles,
                    activeProfileId: newActive?.id ?? null,
                    hasCompletedOnboarding: newProfiles.length > 0,
                });
            }
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete profile' });
            throw error;
        }
    },

    // Mark onboarding as complete
    completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
    },
}));

// Convenience hooks
export function useProfiles() {
    const profiles = useProfileStore(state => state.profiles);
    const isLoading = useProfileStore(state => state.isLoading);
    const error = useProfileStore(state => state.error);
    const loadProfiles = useProfileStore(state => state.loadProfiles);

    return { profiles, isLoading, error, loadProfiles };
}

export function useActiveProfile() {
    const profiles = useProfileStore(state => state.profiles);
    const activeProfileId = useProfileStore(state => state.activeProfileId);
    const setActiveProfile = useProfileStore(state => state.setActiveProfile);

    const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;

    return { activeProfile, setActiveProfile };
}

export function useOnboarding() {
    const hasCompletedOnboarding = useProfileStore(state => state.hasCompletedOnboarding);
    const createProfile = useProfileStore(state => state.createProfile);
    const completeOnboarding = useProfileStore(state => state.completeOnboarding);

    return { hasCompletedOnboarding, createProfile, completeOnboarding };
}
