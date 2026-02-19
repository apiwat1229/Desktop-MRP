import { type ComputedRef, InjectionKey, type Ref } from 'vue'

export const SIDEBAR_COOKIE_NAME = "sidebar:state"
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const SIDEBAR_WIDTH = "16rem"
export const SIDEBAR_WIDTH_MOBILE = "18rem"
export const SIDEBAR_WIDTH_ICON = "3rem"
export const SIDEBAR_KEYBOARD_SHORTCUT = "b"

export type SidebarContext = {
    state: Ref<"expanded" | "collapsed">
    open: ComputedRef<boolean>
    setOpen: (value: boolean) => void
    openMobile: Ref<boolean>
    setOpenMobile: (value: boolean) => void
    isMobile: Ref<boolean>
    toggleSidebar: () => void
}

export const SIDEBAR_CONTEXT_KEY: InjectionKey<SidebarContext> = Symbol("sidebarContext")
