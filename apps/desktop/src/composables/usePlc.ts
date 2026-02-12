import { useAuthStore } from '@/stores/auth';
import { io, Socket } from 'socket.io-client';
import { onMounted, onUnmounted, ref } from 'vue';

const getSocketUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'https://app.ytrc.co.th';
    if (url.endsWith('/api')) {
        url = url.replace('/api', '');
    }
    return url;
};

export interface MarkerState {
    sentData: boolean;
    line1Use: boolean;
    line2Use: boolean;
    line3Use: boolean;
    line4Use: boolean;
}

export interface PoolData {
    color: number;
    text: number;
}

export interface DB54Data {
    brightness: number;
    positions: PoolData[];
}

export const COLOR_OPTIONS = [
    { value: 0, label: 'แดง', color: 'bg-red-500' },
    { value: 1, label: 'เหลือง', color: 'bg-yellow-500' },
    { value: 2, label: 'เขียว', color: 'bg-green-500' },
    { value: 3, label: 'ฟ้า', color: 'bg-sky-400' },
    { value: 4, label: 'น้ำเงิน', color: 'bg-blue-700' },
    { value: 5, label: 'ชมพู', color: 'bg-pink-500' },
];

export const TEXT_OPTIONS = [
    { value: 0, label: 'EUDR' },
    { value: 1, label: 'FSC' },
    { value: 2, label: 'REG' },
];

export const BRIGHTNESS_OPTIONS = [
    { value: 0, label: '0%' },
    { value: 1, label: '25%' },
    { value: 2, label: '50%' },
    { value: 3, label: '75%' },
    { value: 4, label: '100%' },
];

export function usePlc() {
    const authStore = useAuthStore();
    const socket = ref<Socket | null>(null);
    const isConnected = ref(false);

    // DB26 / Marker Data
    const dbData = ref<number[]>(Array(8).fill(0));
    const markerData = ref<MarkerState>({
        sentData: false,
        line1Use: false,
        line2Use: false,
        line3Use: false,
        line4Use: false,
    });

    // DB54 Data
    const brightness = ref(0);
    const pools = ref<PoolData[]>(Array.from({ length: 23 }, () => ({ color: 0, text: 0 })));

    const error = ref<string | null>(null);
    const successMessage = ref<string | null>(null);
    const isLoading = ref(false);
    const hasData = ref(false);

    const connect = () => {
        if (socket.value) return;

        const baseUrl = getSocketUrl();
        socket.value = io(`${baseUrl}/plc`, {
            auth: {
                token: authStore.accessToken,
            },
        });

        socket.value.on('connect', () => {
            isConnected.value = true;
            console.log('Connected to PLC Gateway');
        });

        socket.value.on('disconnect', () => {
            isConnected.value = false;
        });

        socket.value.on('db-data', (data: number[]) => {
            dbData.value = data;
            hasData.value = true;
        });

        socket.value.on('marker-data', (data: MarkerState) => {
            markerData.value = data;
        });

        socket.value.on('db54-data', (data: DB54Data) => {
            brightness.value = data.brightness;
            pools.value = data.positions;
            hasData.value = true;
        });

        socket.value.on('plc-error', (data: { message: string }) => {
            error.value = data.message;
            setTimeout(() => (error.value = null), 5000);
        });

        socket.value.on('write-success', (data: { message: string }) => {
            successMessage.value = data.message;
            setTimeout(() => (successMessage.value = null), 3000);
        });

        socket.value.on('db54-write-success', (data: { message: string }) => {
            successMessage.value = data.message;
            setTimeout(() => (successMessage.value = null), 3000);
        });
    };

    const writeAndPulse = (values: number[]) => {
        socket.value?.emit('write-and-pulse', values);
    };

    const updateLineUse = (bit: number, value: boolean) => {
        socket.value?.emit('write-line-use', { bit, value });
    };

    const writeDb54 = () => {
        socket.value?.emit('db54-write-and-pulse', {
            brightness: brightness.value,
            positions: pools.value,
        });
    };

    const reload = () => {
        socket.value?.emit('db54-read');
        socket.value?.emit('read-db');
    };

    const updatePoolColor = (index: number, color: number) => {
        pools.value[index].color = color;
    };

    const updatePoolText = (index: number, text: number) => {
        pools.value[index].text = text;
    };

    const updateBrightness = (val: number) => {
        brightness.value = val;
    };

    const resetAll = () => {
        brightness.value = 0;
        pools.value = Array.from({ length: 23 }, () => ({ color: 0, text: 0 }));
    };

    onMounted(connect);
    onUnmounted(() => {
        socket.value?.disconnect();
        socket.value = null;
    });

    return {
        isConnected,
        dbData,
        markerData,
        brightness,
        pools,
        error,
        successMessage,
        isLoading,
        hasData,
        writeAndPulse,
        updateLineUse,
        writeDb54,
        reload,
        updatePoolColor,
        updatePoolText,
        updateBrightness,
        resetAll,
        COLOR_OPTIONS,
        TEXT_OPTIONS,
        BRIGHTNESS_OPTIONS,
    };
}
