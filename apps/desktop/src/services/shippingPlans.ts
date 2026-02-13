import api from './api';

export interface ShippingPlanItem {
    id?: string;
    rowId: string;
    palletNo: number;
    row?: any;
}

export interface ShippingPlan {
    id?: string;
    planNo: string;
    customer?: string;
    planDate: string | Date;
    status?: string;
    remark?: string;
    items: ShippingPlanItem[];
    createdAt?: string;
}

export interface AvailablePallet {
    rowId: string;
    lotNo: string;
    palletNo: number;
    weight: number;
    startTime: string;
    palletType: string;
}

export const shippingPlansApi = {
    getAll: async (): Promise<ShippingPlan[]> => {
        const response = await api.get('/shipping-plans');
        return response.data;
    },

    getAvailablePallets: async (): Promise<AvailablePallet[]> => {
        const response = await api.get('/shipping-plans/available-pallets');
        return response.data;
    },

    create: async (data: ShippingPlan): Promise<ShippingPlan> => {
        const response = await api.post('/shipping-plans', data);
        return response.data;
    },
};
