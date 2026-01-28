import { usePermissions } from '@/composables/usePermissions';
import {
    Bell,
    Calendar,
    Factory,
    Layers,
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
            title: t('admin.sidebar.main'),
            items: [

                {
                    name: t('admin.sidebar.roles'),
                    path: '/admin/roles',
                    icon: Shield,
                    permission: 'roles:read',
                },
                {
                    name: t('admin.sidebar.users'),
                    path: '/admin/users',
                    icon: Users,
                    permission: 'users:read',
                },
                {
                    name: t('admin.sidebar.suppliers'),
                    path: '/admin/suppliers',
                    icon: Truck,
                    permission: 'suppliers:read',
                },
                {
                    name: t('admin.sidebar.rubberTypes'),
                    path: '/admin/rubber-types',
                    icon: Layers,
                    permission: 'rubberTypes:read',
                },
                {
                    name: t('admin.sidebar.notifications'),
                    path: '/admin/notifications',
                    icon: Bell,
                    permission: 'notifications:read',
                },
                {
                    name: 'Production Reports',
                    path: '/admin/production',
                    icon: Layers,
                    permission: 'production:read',
                },

            ],
        },
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
                },
            ],
        },
        {
            title: t('admin.sidebar.system'),
            items: [
                { name: t('admin.systemStatus.title'), path: '/admin/system-status', icon: Server },
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
