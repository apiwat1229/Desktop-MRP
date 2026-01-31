export const storage = {
    get(key: string) {
        if ((window as any).ipcRenderer && (window as any).ipcRenderer.storage) {
            return (window as any).ipcRenderer.storage.get(key);
        }
        // Fallback for non-electron env (e.g. browser dev)
        const val = localStorage.getItem(key);
        try {
            return val ? JSON.parse(val) : null;
        } catch {
            return val;
        }
    },
    set(key: string, value: any) {
        // Ensure value is serializable and not a Proxy
        if (value === undefined) {
            this.delete(key);
            return;
        }
        const cleanValue = JSON.parse(JSON.stringify(value));
        if ((window as any).ipcRenderer && (window as any).ipcRenderer.storage) {
            (window as any).ipcRenderer.storage.set(key, cleanValue);
        } else {
            localStorage.setItem(key, JSON.stringify(cleanValue));
        }
    },
    delete(key: string) {
        if ((window as any).ipcRenderer && (window as any).ipcRenderer.storage) {
            (window as any).ipcRenderer.storage.delete(key);
        } else {
            localStorage.removeItem(key);
        }
    }
};
