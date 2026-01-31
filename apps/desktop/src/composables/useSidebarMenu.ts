import { usePermissions } from '@/composables/usePermissions';
import {
    Bell,
    Calendar,
    Factory,
    FlaskConical,
    Layers,
    Package,
    Server,
    Shield,
    Truck,
    Users
} from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export function useSidebarMenu() {
    const { hasPermission, isAdmin } = usePermissions();
    const { t } = useI18n();

    const allMenuGroups = computed(() => [
        {
            title: t('services.title'),
            items: [
                {
                    name: t('services.booking.name'),
                    path: '/bookings',
                    icon: Calendar,
                    items: [
                        { name: 'Cuplump', path: '/bookings/cuplump' },
                        { name: 'USS', path: '/bookings/uss' },
                    ],
                },
                {
                    name: t('services.mrp.name'),
                    path: '/mrp',
                    icon: Factory,
                    items: [
                        { name: 'Cuplump Pool', path: '/cuplump-pool' },
                    ]
                },
                {
                    name: t('services.qa.name'),
                    path: '/admin/qa',
                    icon: FlaskConical, // Ensure FlaskConical is imported
                    items: [
                        { name: 'Cuplump', type: 'label' as const },
                        { name: t('services.qa.menu.clPoPri'), path: '/admin/qa/cl-po-pri' },
                        { name: t('services.qa.menu.clLab'), path: '/admin/qa/cl-lab' },
                        { name: t('services.qa.menu.clIncoming'), path: '/admin/qa/cl-summary' },
                        { type: 'separator' as const },
                        { name: 'USS', type: 'label' as const },
                        { name: t('services.qa.menu.ussPoPri'), path: '/admin/qa/uss-po-pri' },
                        { name: t('services.qa.menu.ussIncoming'), path: '/admin/qa/uss-summary' },
                    ],
                },
                {
                    name: 'Production',
                    path: '/admin/production',
                    icon: Layers,
                    items: [
                        { name: t('production.reportList'), path: '/admin/production/reports' },
                        { name: t('production.jobOrderList'), path: '/admin/production/job-orders' },
                    ],
                },
                {
                    name: t('admin.departments.rawMaterial'),
                    path: '/admin/receiving',
                    icon: Package,
                    items: [
                        { name: t('services.cuplump.name'), path: '/admin/receiving/cuplump' },
                        { name: 'USS', path: '/admin/receiving/uss' },
                    ],
                },
                {
                    name: t('admin.truckScale.name'),
                    path: '/admin/truck-scale',
                    icon: Truck,
                    items: [
                        { name: t('admin.truckScale.checkIn'), path: '/admin/truck-scale/check-in' },
                        { name: t('admin.truckScale.scaleIn'), path: '/admin/truck-scale/scale-in' },
                        { name: t('admin.truckScale.scaleOut'), path: '/admin/truck-scale/scale-out' },
                        { name: t('admin.truckScale.dashboard'), path: '/admin/truck-scale/dashboard' },
                    ],
                },
            ],
        },
        {
            title: t('admin.sidebar.system'),
            items: [
                {
                    name: t('admin.sidebar.notifications'),
                    path: '/admin/notifications',
                    icon: Bell,
                    permission: 'notifications:read',
                },
                {
                    name: t('admin.sidebar.roles'),
                    path: '/admin/roles',
                    icon: Shield,
                    permission: 'roles:read',
                },
                {
                    name: t('admin.sidebar.rubberTypes'),
                    path: '/admin/rubber-types',
                    icon: Layers,
                    permission: 'rubberTypes:read',
                },
                {
                    name: t('admin.sidebar.suppliers'),
                    path: '/admin/suppliers',
                    icon: Truck,
                    permission: 'suppliers:read',
                },
                { name: t('admin.systemStatus.title'), path: '/admin/system-status', icon: Server },
                {
                    name: t('admin.sidebar.users'),
                    path: '/admin/users',
                    icon: Users,
                    permission: 'users:read',
                },
            ],
        },
    ]);

    const menuGroups = computed(() => {
        return allMenuGroups.value
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                    if (!('permission' in item) || !item.permission) return true;
                    if (isAdmin.value) return true;
                    return hasPermission(item.permission);
                }),
            }))
            .filter((group) => group.items.length > 0);
    });

    return {
        menuGroups,
    };
}
