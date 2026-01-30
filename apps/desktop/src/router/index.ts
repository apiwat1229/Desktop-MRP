import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';

const routes = [
    {
        path: '/public/log/:id',
        name: 'PublicRepairLog',
        component: () => import('../views/public/PublicRepairView.vue'),
    },
    {
        path: '/',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard', // Changed from Home to Dashboard to match Sidebar
                component: Home,
            },
            {
                path: 'queue',
                name: 'Queue & Booking',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'users',
                name: 'Users',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'activity-center',
                name: 'ActivityCenter',
                component: () => import('../views/ActivityCenter.vue'),
            },
            {
                path: 'my-notifications',
                name: 'MyNotifications',
                redirect: '/activity-center#notifications',
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/Profile.vue'),
            },
            {
                path: 'bookings',
                children: [
                    {
                        path: '',
                        redirect: '/bookings/cuplump',
                    },
                    {
                        path: 'cuplump',
                        name: 'BookingCuplump',
                        component: () => import('../views/admin/BookingQueue.vue'),
                    },
                    {
                        path: 'uss',
                        name: 'BookingUSS',
                        component: () => import('../views/admin/BookingQueue.vue'),
                    },
                ]
            },
        ]
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }
    },
    {
        path: '/signup',
        name: 'Signup',
        component: () => import('../views/Signup.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/pending-approval',
        name: 'PendingApproval',
        component: () => import('../views/PendingApproval.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/mrp',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'MRP System',
                component: () => import('../views/admin/Mrp.vue'),
            }
        ]
    },
    {
        path: '/admin',
        name: 'AdminPanel',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'AdminDashboard',
                component: () => import('../views/admin/Dashboard.vue'),
            },
            {
                path: 'system-status',
                name: 'SystemStatus',
                component: () => import('../views/admin/SystemStatus.vue'),
            },
            {
                path: 'roles',
                name: 'Roles',
                component: () => import('../views/admin/Roles.vue'),
            },
            {
                path: 'users',
                name: 'Users Management',
                component: () => import('../views/admin/UsersManagement.vue'),
            },
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('../views/admin/Suppliers.vue'),
            },
            {
                path: 'rubber-types',
                name: 'Rubber Types',
                component: () => import('../views/admin/RubberTypes.vue'),
            },
            {
                path: 'notifications',
                name: 'Notifications',
                component: () => import('../views/admin/NotificationsManagement.vue'),
            },
            {
                path: 'purchasing',
                name: 'Purchasing',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'cuplump/:id',
                name: 'CuplumpDetail',
                component: () => import('../views/admin/CuplumpDetail.vue'),
            },
            {
                path: 'uss',
                name: 'USS',
                component: () => import('../views/admin/Uss.vue'),
            },
            {
                path: 'qa/:tab?',
                name: 'QualityAssurance',
                component: () => import('../views/admin/QualityAssurance.vue'),
            },
            {
                path: 'production',
                children: [
                    {
                        path: '',
                        redirect: '/admin/production/reports',
                    },
                    {
                        path: 'reports',
                        name: 'ProductionReports',
                        component: () => import('../views/admin/Production.vue'),
                    },
                    {
                        path: 'job-orders',
                        name: 'JobOrders',
                        component: () => import('../views/admin/Production.vue'),
                    },
                ]
            },
            {
                path: 'uss/:id',
                name: 'UssDetail',
                component: () => import('../views/admin/UssDetail.vue'),
            },


            {
                path: 'analytics',
                name: 'Analytics',
                component: () => import('../views/Placeholder.vue'),
            },
            {
                path: 'helpdesk',
                name: 'Help Desk',
                component: () => import('../views/admin/HelpDesk.vue'),
            },
        ]
    },
    {
        path: '/approvals',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Approvals',
                redirect: '/activity-center#approvals',
            },
            {
                path: ':id',
                name: 'Approval Detail',
                component: () => import('@/views/approvals/ApprovalDetail.vue'),
            },
        ]
    },
    {
        path: '/change-password',
        name: 'ChangePassword',
        component: () => import('../views/ChangePassword.vue'),
    },
    {
        path: '/error',
        name: 'Error',
        component: () => import('../views/Error.vue'),
    },
    {
        path: '/scale',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'TruckScale',
                component: () => import('../views/admin/TruckScale.vue'),
            }
        ]
    },
    {
        path: '/cuplump-pool',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Cuplump Pool',
                component: () => import('../views/admin/CuplumpPoolManagement.vue'),
            }
        ]
    },
    {
        path: '/my-machine',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'My Machine',
                component: () => import('../views/admin/MyMachine.vue'),
            },
            {
                path: 'stock/add',
                name: 'AddStock',
                component: () => import('../views/admin/StockFormPage.vue'),
            },
            {
                path: ':id',
                name: 'MachineDetail',
                component: () => import('../views/admin/components/mymachine/MachineDetail.vue'),
            }
        ]
    },
    {
        path: '/maintenance',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Maintenance',
                component: () => import('../views/admin/Maintenance.vue'),
            },
            {
                path: ':id',
                name: 'MaintenanceDetail',
                component: () => import('../views/admin/components/maintenance/MachineDetail.vue'),
            }
        ]
    },
    {
        path: '/admin/contracts',
        component: () => import('@/components/layout/NavbarOnlyLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Contracts',
                component: () => import('../views/admin/contracts/ContractList.vue'),
            },
            {
                path: 'create',
                name: 'CreateContract',
                component: () => import('../views/admin/contracts/ContractForm.vue'),
            },
            {
                path: ':id',
                name: 'EditContract',
                component: () => import('../views/admin/contracts/ContractForm.vue'),
            },
        ]
    },
    {
        path: '/admin/receiving',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/admin/receiving/cuplump',
            },
            {
                path: 'cuplump',
                name: 'ReceivingCuplump',
                component: () => import('../views/admin/Receiving.vue'),
            },
            {
                path: 'uss',
                name: 'ReceivingUSS',
                component: () => import('../views/admin/Receiving.vue'),
            },
        ]
    },
    {
        path: '/admin/truck-scale',
        component: () => import('@/components/layout/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/admin/truck-scale/check-in',
            },
            {
                path: 'check-in',
                name: 'TruckScaleCheckIn',
                component: () => import('../views/admin/TruckScale.vue'),
            },
            {
                path: 'scale-in',
                name: 'TruckScaleScaleIn',
                component: () => import('../views/admin/TruckScale.vue'),
            },
            {
                path: 'scale-out',
                name: 'TruckScaleScaleOut',
                component: () => import('../views/admin/TruckScale.vue'),
            },
            {
                path: 'dashboard',
                name: 'TruckScaleDashboard',
                component: () => import('../views/admin/TruckScale.vue'),
            },
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../views/NotFound.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.meta.requiresGuest && isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;
