const TOKEN_KEY = 'notebooklm_token';
export const TOKEN_CHANGED_EVENT = 'quello:token-changed';

function emitTokenChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT));
  }
}

export const auth = {
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      emitTokenChanged();
    }
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      emitTokenChanged();
    }
  },
  
  isAuthenticated: () => {
    return !!auth.getToken();
  }
};
