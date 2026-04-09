// 구글 accounts.id 타입
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: { credential: string }) => void
    ux_mode?: string
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }) => void
  prompt: () => void
  // 이전 구글 세션 및 자동 로그인 취소 (중복 콜백 방지용)
  cancel: () => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string
      theme?: string
      size?: string
      text?: string
      shape?: string
      width?: number
      logo_alignment?: string
    }
  ) => void
}

// window.google 타입
interface GoogleWindow {
  accounts: {
    id: GoogleAccountsId
  }
}

// Window에 google 속성 추가 (전역 1회 선언)
declare global {
  interface Window {
    google: GoogleWindow
  }
}

export {}