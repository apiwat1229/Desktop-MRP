/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: {
    send(channel: string, ...args: any[]): void;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    removeListener(channel: string, listener: (event: any, ...args: any[]) => void): void;
    removeAllListeners(channel: string): void;

    app: {
      reload(): void;
      forceReload(): void;
      toggleDevTools(): void;
      zoomIn(): void;
      zoomOut(): void;
      zoomReset(): void;
      toggleFullScreen(): void;
    };

    window: {
      minimize(): void;
      maximize(): void;
      close(): void;
    };

    autoUpdate: {
      checkForUpdates(): void;
      downloadUpdate(): void;
      installUpdate(): void;
      onChecking(callback: () => void): () => void;
      onUpdateAvailable(callback: (info: any) => void): () => void;
      onUpdateNotAvailable(callback: (info: any) => void): () => void;
      onDownloadProgress(callback: (progress: any) => void): () => void;
      onUpdateDownloaded(callback: (info: any) => void): () => void;
      onError(callback: (error: string) => void): () => void;
    };
  }
}
