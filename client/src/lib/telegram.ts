import { TelegramUser, TelegramWebAppUser } from "@/types";

declare global {
  interface Window {
    debugApp?: any;
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: TelegramWebAppUser;
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
          setText: (text: string) => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        openLink: (url: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendData: (data: string) => void;
        CloudStorage: {
          getItem: (key: string, callback: (err: Error | null, value: string | null) => void) => void;
          setItem: (key: string, value: string, callback: (err: Error | null, success: boolean) => void) => void;
          removeItem: (key: string, callback: (err: Error | null, success: boolean) => void) => void;
          getItems: (keys: string[], callback: (err: Error | null, values: { [key: string]: string | null }) => void) => void;
          removeItems: (keys: string[], callback: (err: Error | null, success: boolean) => void) => void;
        };
        version: string;
        colorScheme: string;
        platform: string;
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
          secondary_bg_color: string;
        };
      };
    };
  }
}

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
          }
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
        enableClosingConfirmation: () => {},
        disableClosingConfirmation: () => {},
        onEvent: () => {},
        offEvent: () => {},
        sendData: () => {},
        CloudStorage: {
          getItem: (key: string, callback: (err: Error | null, value: string | null) => void) => {
            callback(null, localStorage.getItem(key));
          },
          setItem: (key: string, value: string, callback: (err: Error | null, success: boolean) => void) => {
            localStorage.setItem(key, value);
            callback(null, true);
          },
          removeItem: (key: string, callback: (err: Error | null, success: boolean) => void) => {
            localStorage.removeItem(key);
            callback(null, true);
          },
          getItems: (keys: string[], callback: (err: Error | null, values: { [key: string]: string | null }) => void) => {
            const values: { [key: string]: string | null } = {};
            keys.forEach(key => {
              values[key] = localStorage.getItem(key);
            });
            callback(null, values);
          },
          removeItems: (keys: string[], callback: (err: Error | null, success: boolean) => void) => {
            keys.forEach(key => localStorage.removeItem(key));
            callback(null, true);
          }
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
        }
      }
    };
    return true;
  }
}

// Get Telegram user data
export function getTelegramUser(): TelegramUser | null {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe.user || null;
  }
  return null;
}

// Get raw init data
export function getInitData(): string {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp.initData;
  }
  return "";
}

// Show alert using Telegram's native UI
export function showAlert(message: string, callback?: () => void) {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showAlert(message, callback);
  } else {
    alert(message);
    if (callback) callback();
  }
}

// Show confirmation dialog using Telegram's native UI
export function showConfirm(message: string, callback: (confirmed: boolean) => void) {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback);
  } else {
    const confirmed = confirm(message);
    callback(confirmed);
  }
}

// Configure main button
export function setupMainButton(config: {
  text: string;
  color?: string;
  textColor?: string;
  onClick: () => void;
}) {
  if (window.Telegram && window.Telegram.WebApp) {
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
  if (window.Telegram && window.Telegram.WebApp) {
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
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  }
}
