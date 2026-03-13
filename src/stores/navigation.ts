import type { DateValue } from '@internationalized/date';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNavigationStore = defineStore('navigation', () => {
    const title = ref('');
    const showControls = ref(false);
    const searchQuery = ref('');
    const date = ref<DateValue | undefined>(undefined);
    const dateRange = ref<{ start: DateValue | undefined, end: DateValue | undefined }>({ start: undefined, end: undefined });

    const setTitle = (newTitle: string) => {
        title.value = newTitle;
    };

    const setControlsVisible = (visible: boolean) => {
        showControls.value = visible;
    };

    const reset = () => {
        title.value = '';
        showControls.value = false;
        searchQuery.value = '';
        date.value = undefined;
        dateRange.value = { start: undefined, end: undefined };
    };

    return {
        title,
        showControls,
        searchQuery,
        date,
        dateRange,
        setTitle,
        setControlsVisible,
        reset
    };
});
