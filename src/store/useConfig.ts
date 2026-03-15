import { create } from 'zustand'
import type { Song } from '../types/tauri'

const getDefaultConfig = () => ({
    welcomeMessage: 'Hola desde tu configuración personalizada!',
    autoPlay: false,
    theme: 'dark',
    accentColor: '#ff8a00'
    ,hardwareAcceleration: true,
    autoUpdate: true
});

type _RendererConfigAPI = {
    getUserConfig?: () => Promise<Partial<ConfigState['appConfig']>>;
    onConfigUpdated?: (listener: (cfg: Partial<ConfigState['appConfig']>) => void) => void;
    setUserConfig?: (config: ConfigState['appConfig']) => Promise<Partial<ConfigState['appConfig']> | void>;
};
const getElApi = () => (window as unknown as { tauriAPI?: _RendererConfigAPI }).tauriAPI;

interface ConfigState {
    openVersionDialog: boolean;
    setOpenVersionDialog: (open: boolean) => void;
    openErrorDialog: boolean;
    errorMessage?: string | null;
    errorSong?: Partial<Song> | null;
    setOpenSettingsDialog: (open: boolean) => void;
    openSettingsDialog: boolean;
    /**
     * Abre o cierra el diálogo de error. Opcionalmente puede recibir un
     * mensaje y la información de la canción que falló.
     */
    setOpenErrorDialog: (open: boolean, message?: string | null, song?: Partial<Song> | null) => void;
        // App configuration
        appConfig: {
            theme?: string;
            accentColor?: string;
            welcomeMessage?: string;
            autoPlay?: boolean;
            hardwareAcceleration?: boolean;
            autoUpdate?: boolean;
        };
        loadConfig: () => Promise<void>;
        saveConfig: () => Promise<void>;
        setTheme: (themeId: string) => void;
        setAccentColor: (color: string) => void;
        updateAppConfig: (patch: Partial<{ theme?: string; accentColor?: string; welcomeMessage?: string; autoPlay?: boolean; hardwareAcceleration?: boolean; autoUpdate?: boolean }>) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
    setOpenSettingsDialog(open) {
        set({ openSettingsDialog: open })
    },
    openSettingsDialog: false,
    openVersionDialog: false,
    setOpenVersionDialog: (open: boolean) => set({ openVersionDialog: open }),
    openErrorDialog: false,
    errorMessage: null,
    errorSong: null,
    setOpenErrorDialog: (open: boolean, message: string | null = null, song: Partial<Song> | null = null) => set({ openErrorDialog: open, errorMessage: message, errorSong: song }),
            appConfig: {
            theme: 'dark',
            accentColor: '#ff8a00',
            welcomeMessage: 'Hola desde tu configuración personalizada!',
            autoPlay: false
                ,hardwareAcceleration: true,
                autoUpdate: true
        },
        loadConfig: async () => {
            const elApi = getElApi();
            try {
                const cfg = await elApi?.getUserConfig?.();
                set({ appConfig: { ...getDefaultConfig(), ...(cfg || {}) } as unknown as ConfigState['appConfig'] });
                // Apply theme & accent color to document
                const settings = { ...getDefaultConfig(), ...(cfg || {}) };
                if (settings.theme) {
                    document.documentElement.setAttribute('data-theme', settings.theme);
                    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
                    else document.documentElement.classList.remove('dark');
                }
                if (settings.accentColor) {
                    document.documentElement.style.setProperty('--accent', settings.accentColor);
                    document.documentElement.style.setProperty('--sidebar-accent', settings.accentColor);
                    document.documentElement.style.setProperty('--primary', settings.accentColor);
                    document.documentElement.style.setProperty('--color-primary', settings.accentColor);
                }
            } catch (e) { console.warn('Failed to load config from main', e); }
            // register listener if available
            try {
                if (elApi?.onConfigUpdated) {
                    elApi.onConfigUpdated((cfg: Partial<ConfigState['appConfig']>) => {
                        set({ appConfig: { ...getDefaultConfig(), ...(cfg || {}) } as unknown as ConfigState['appConfig'] });
                        if (cfg.theme) document.documentElement.setAttribute('data-theme', cfg.theme);
                        if (cfg.accentColor) {
                            document.documentElement.style.setProperty('--accent', cfg.accentColor);
                            document.documentElement.style.setProperty('--sidebar-accent', cfg.accentColor);
                        }
                    });
                }
            } catch { /* ignore */ }
        },
        saveConfig: async () => {
            try {
                const { appConfig } = useConfigStore.getState();
            const elApiLocal = getElApi();
            const result = await elApiLocal?.setUserConfig?.(appConfig);
                // reflect any changes returned by main
                set({ appConfig: { ...getDefaultConfig(), ...(result || {}) } as unknown as ConfigState['appConfig'] });
            } catch (e) { console.warn('Failed to save config', e); }
        },
        setTheme: (themeId: string) => set((state) => {
                const next = { ...state.appConfig, theme: themeId };
                // set both data-theme attribute and the legacy 'dark' class
                document.documentElement.setAttribute('data-theme', themeId);
                if (themeId === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
                return { appConfig: next };
            }),
        setAccentColor: (color: string) => set((state) => {
            const next = { ...state.appConfig, accentColor: color };
            // set css variables for theme
            document.documentElement.style.setProperty('--accent', color);
            document.documentElement.style.setProperty('--sidebar-accent', color);
            // also update primary so components relying on --primary (buttons) will follow accent
            document.documentElement.style.setProperty('--primary', color);
            document.documentElement.style.setProperty('--color-primary', color);
            return { appConfig: next };
        }),
        updateAppConfig: (patch) => set((state) => ({ appConfig: { ...state.appConfig, ...(patch || {}) } }))
}))