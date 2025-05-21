import { TelegramUser, TelegramWebAppUser } from "@/types";

/**
 * Telegram WebApp API'si için TypeScript tanımları
 */
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      auth_date?: number;
      hash?: string;
    };
    chat_instance?: string;
    chat_type?: string;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    setText: (text: string) => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert?: (message: string, callback?: () => void) => void;
  showConfirm?: (message: string, callback: (confirmed: boolean) => void) => void;
  openLink?: (url: string) => void;
}

/**
 * window.Telegram, WebApp API'si için global değişken
 */
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Telegram WebApp initData değerini alır
 * @returns Telegram initData veya mock test değeri
 */
export const getInitData = (): string | null => {
  try {
    if (window.Telegram?.WebApp) {
      // Gerçek Telegram WebApp kullanılıyor
      return window.Telegram.WebApp.initData;
    } else {
      // Geliştirme ortamı - test için mock değeri döndür
      console.warn("Telegram WebApp not found - returning mock data for testing");
      
      // Geliştirme ortamında olup olmadığımızı kontrol et
      if (process.env.NODE_ENV === 'development') {
        return 'mock_init_data';
      }
      
      return null;
    }
  } catch (error) {
    console.error("Error getting Telegram initData:", error);
    return null;
  }
};

/**
 * Telegram WebApp kullanıcı bilgilerini alır
 * @returns Kullanıcı bilgileri veya null
 */
export const getTelegramUser = () => {
  try {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
      return window.Telegram.WebApp.initDataUnsafe.user;
    }
    return null;
  } catch (error) {
    console.error("Error getting Telegram user:", error);
    return null;
  }
};

/**
 * Telegram WebApp API'sinin kullanılabilir olup olmadığını kontrol eder
 * @returns WebApp API'si mevcutsa true, değilse false
 */
export const isTelegramWebAppAvailable = (): boolean => {
  return !!window.Telegram?.WebApp;
};

/**
 * Telegram UI renklerini uygulamak için stil CSS değişkenlerini oluşturur
 */
export const applyTelegramTheme = (): void => {
  try {
    if (window.Telegram?.WebApp?.themeParams) {
      const params = window.Telegram.WebApp.themeParams;
      
      // Tema renklerini CSS değişkenlerine uygula
      document.documentElement.style.setProperty('--tg-bg-color', params.bg_color);
      document.documentElement.style.setProperty('--tg-text-color', params.text_color);
      document.documentElement.style.setProperty('--tg-hint-color', params.hint_color);
      document.documentElement.style.setProperty('--tg-link-color', params.link_color);
      document.documentElement.style.setProperty('--tg-button-color', params.button_color);
      document.documentElement.style.setProperty('--tg-button-text-color', params.button_text_color);
      
      if (params.secondary_bg_color) {
        document.documentElement.style.setProperty('--tg-secondary-bg-color', params.secondary_bg_color);
      }
    }
  } catch (error) {
    console.error("Error applying Telegram theme:", error);
  }
};

// Initialize Telegram Web App
export function initializeTelegramWebApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    // Expand the Web App to take up the entire screen
    window.Telegram.WebApp.expand();
    
    // Tell Telegram that the Web App is ready
    window.Telegram.WebApp.ready();
    
    console.log("Telegram WebApp initialized");
    return true;
  } else {
    console.warn("Telegram WebApp is not available - running in test mode");
    
    // Create a mock Telegram WebApp object for testing
    window.Telegram = {
      WebApp: {
        initData: "mock_init_data",
        initDataUnsafe: {
          user: {
            id: 123456789,
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            photo_url: "",
            auth_date: Math.floor(Date.now() / 1000),
            hash: "mock_hash"
          },
          auth_date: Math.floor(Date.now() / 1000),
          hash: "mock_hash"
        },
        ready: () => {},
        expand: () => {},
        close: () => {},
        MainButton: {
          text: "",
          color: "#000000",
          textColor: "#ffffff",
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          showProgress: () => {},
          hideProgress: () => {},
          setText: () => {},
          setParams: () => {}
        },
        BackButton: {
          isVisible: false,
          onClick: () => {},
          offClick: () => {},
          show: () => {},
          hide: () => {}
        },
        openLink: () => {},
        showAlert: (message: string, callback?: () => void) => {
          alert(message);
          if (callback) callback();
        },
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => {
          const confirmed = confirm(message);
          callback(confirmed);
        },
        version: "1.0.0",
        colorScheme: "dark",
        platform: "web",
        themeParams: {
          bg_color: "#212121",
          text_color: "#ffffff",
          hint_color: "#aaaaaa",
          link_color: "#8774e1",
          button_color: "#8774e1",
          button_text_color: "#ffffff",
          secondary_bg_color: "#0f0f0f"
        },
        isExpanded: true,
        viewportHeight: 600,
        viewportStableHeight: 600
      }
    };
    return true;
  }
}

// Show alert using Telegram's native UI
export const showAlert = (message: string, callback?: () => void): void => {
  if (window.Telegram?.WebApp?.showAlert) {
    window.Telegram.WebApp.showAlert(message, callback);
  } else {
    alert(message);
    if (callback) callback();
  }
};

// Show confirmation dialog using Telegram's native UI
export const showConfirm = (message: string, callback: (confirmed: boolean) => void): void => {
  if (window.Telegram?.WebApp?.showConfirm) {
    window.Telegram.WebApp.showConfirm(message, callback);
  } else {
    const confirmed = window.confirm(message);
    callback(confirmed);
  }
};

// Configure main button
export function setupMainButton(config: {
  text: string;
  color?: string;
  textColor?: string;
  onClick: () => void;
}) {
  if (window.Telegram?.WebApp) {
    const { MainButton } = window.Telegram.WebApp;
    
    MainButton.setText(config.text);
    if (config.color) MainButton.color = config.color;
    if (config.textColor) MainButton.textColor = config.textColor;
    
    MainButton.onClick(config.onClick);
    MainButton.show();
  }
}

// Handle back button
export function setupBackButton(onClick: () => void) {
  if (window.Telegram?.WebApp) {
    const { BackButton } = window.Telegram.WebApp;
    
    BackButton.onClick(onClick);
    BackButton.show();
    
    return () => {
      BackButton.offClick(onClick);
      BackButton.hide();
    };
  }
  
  return () => {};
}

// Close the Web App
export function closeWebApp() {
  if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.close === 'function') {
    window.Telegram.WebApp.close();
  }
}

export function isInTelegram(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.Telegram?.WebApp;
}

export const openTelegramAuth = () => {
  const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME;
  if (!botName) {
    throw new Error("VITE_TELEGRAM_BOT_NAME is not set");
  }

  const width = 550;
  const height = 470;
  const left = Math.max(0, (window.innerWidth - width) / 2);
  const top = Math.max(0, (window.innerHeight - height) / 2);

  const popup = window.open(
    `https://oauth.telegram.org/auth?bot_id=${botName}`,
    "Telegram Auth",
    `width=${width},height=${height},left=${left},top=${top}`
  );

  return new Promise((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        reject(new Error("Auth window closed"));
      }
    }, 500);

    window.addEventListener("message", (event) => {
      if (event.data?.type === "telegram_auth") {
        clearInterval(checkClosed);
        popup?.close();
        resolve(event.data.user);
      }
    });
  });
};

// Telegram'da hazır olduğunu bildir
export const ready = (): void => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
  }
};

// Telegram link aç
export const openLink = (url: string): void => {
  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
};
