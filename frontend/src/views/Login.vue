<script setup lang="ts">
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue';
import WindowControls from '@/components/layout/WindowControls.vue';
import LoginForm from '@/components/LoginForm.vue';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { storage } from '@/services/storage';
import { useAuthStore } from '@/stores/auth';
import { AlertCircle, Settings2 } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';

const loginError = ref('');
const showChangePasswordDialog = ref(false);
const tempToken = ref('');
const emailForChange = ref('');
const loginFormRef = ref<InstanceType<typeof LoginForm> | null>(null);
const mode = ref<'app' | 'system'>('app');

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

// Load saved email on mount
onMounted(() => {
  const savedEmail = storage.get('saved_email');
  const rememberMe = storage.get('remember_me');

  if (savedEmail && rememberMe === 'true' && loginFormRef.value) {
    loginFormRef.value.setEmail(savedEmail);
    loginFormRef.value.setRememberMe(true);
  }
});

async function handleLogin({
  email,
  password,
  rememberMe,
}: {
  email: string;
  password: string;
  rememberMe: boolean;
}) {
  if (loginFormRef.value) {
    loginFormRef.value.setLoading(true);
  }
  loginError.value = '';

  try {
    await authStore.login({ email, password }, rememberMe);

    // Handle Remember Me
    if (rememberMe) {
      storage.set('saved_email', email);
      storage.set('remember_me', 'true');
    } else {
      storage.delete('saved_email');
      storage.delete('remember_me');
    }

    // Check user status
    if (authStore.user?.status === 'PENDING') {
      router.push('/pending-approval');
      return;
    }

    if (mode.value === 'system') {
      const role = authStore.user?.role || '';
      const userEmail = authStore.user?.email || '';
      const permissions = authStore.userPermissions || [];
      const allowed =
        userEmail === 'apiwat.s@ytrc.co.th' ||
        ['ADMIN', 'admin', 'Administrator', 'IT', 'it'].includes(role) ||
        permissions.includes('users:read') ||
        permissions.includes('roles:read');
      if (!allowed) {
        loginError.value = 'คุณไม่มีสิทธิ์เข้าใช้งาน System Setting';
        authStore.logout();
        return;
      }
      router.push('/system');
    } else {
      router.push('/');
    }
  } catch (err: any) {
    console.error('Login failed:', err);

    // Handle force password change
    if (err.response?.data?.code === 'MUST_CHANGE_PASSWORD') {
      tempToken.value = err.response.data.tempToken;
      emailForChange.value = email;
      showChangePasswordDialog.value = true;
      return;
    }

    // Handle account locked
    if (err.response?.data?.message?.includes('locked')) {
      loginError.value = t('auth.accountLocked');
      return;
    }

    // Handle other errors
    loginError.value = err.response?.data?.message || err.message || t('auth.loginFailed');
  } finally {
    if (loginFormRef.value) {
      loginFormRef.value.setLoading(false);
    }
  }
}

function handlePasswordChangeSuccess() {
  showChangePasswordDialog.value = false;
  toast.success(t('auth.passwordChanged'));
  router.push('/');
}
</script>

<template>
  <div
    class="relative min-h-svh w-full flex items-center justify-center p-6 md:p-10 app-drag-region overflow-hidden"
  >
    <!-- Top Bar for Frameless Window -->
    <div class="absolute top-0 right-0 p-2 z-50 app-no-drag">
      <WindowControls />
    </div>

    <div class="w-full max-w-sm app-no-drag relative z-10">
      <!-- Error Alert -->
      <Alert v-if="loginError" variant="destructive" class="mb-4">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>{{ loginError }}</AlertDescription>
      </Alert>

      <LoginForm ref="loginFormRef" @submit="handleLogin">
        <template #before-submit>
          <!-- Mode Toggle -->
          <div class="flex rounded-lg border border-border bg-muted/40 p-1 gap-1">
            <button
              type="button"
              @click="
                mode = 'app';
                loginError = '';
              "
              :class="[
                'flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all',
                mode === 'app'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
            >
              Application
            </button>
            <button
              type="button"
              @click="
                mode = 'system';
                loginError = '';
              "
              :class="[
                'flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all',
                mode === 'system'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
            >
              <Settings2 class="h-3.5 w-3.5" />
              System Setting
            </button>
          </div>

          <!-- System Setting mode notice -->
          <div
            v-if="mode === 'system'"
            class="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
          >
            <div class="flex items-center gap-2 text-xs text-primary font-medium">
              <Settings2 class="h-3.5 w-3.5 shrink-0" />
              <span>สำหรับ IT และ Administrator เท่านั้น</span>
            </div>
          </div>
        </template>
      </LoginForm>
    </div>

    <!-- Change Password Dialog -->
    <ChangePasswordDialog
      v-model:open="showChangePasswordDialog"
      :temp-token="tempToken"
      :email="emailForChange"
      @success="handlePasswordChangeSuccess"
    />
  </div>
</template>

<style scoped>
.app-drag-region {
  -webkit-app-region: drag;
}

.app-no-drag {
  -webkit-app-region: no-drag;
}
</style>
