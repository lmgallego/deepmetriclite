import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  apiKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  user: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple encoding to make API key less visible in storage (not encryption, just obfuscation)
const encodeKey = (key: string): string => {
  return btoa(key.split('').reverse().join(''));
};

const decodeKey = (encoded: string): string => {
  try {
    return atob(encoded).split('').reverse().join('');
  } catch {
    return '';
  }
};

const STORAGE_KEY = '_dm_session';
const USER_KEY = '_dm_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use sessionStorage - clears when browser closes
    const storedKey = sessionStorage.getItem(STORAGE_KEY);
    const storedUser = sessionStorage.getItem(USER_KEY);
    
    if (storedKey) {
      const decoded = decodeKey(storedKey);
      if (decoded) {
        setApiKey(decoded);
      }
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Silent fail
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Basic validation: check key is not empty and has reasonable length
    if (!key || key.trim().length < 10) {
      setIsLoading(false);
      return false;
    }
    
    const trimmedKey = key.trim();
    
    // Store encoded key in sessionStorage (clears on browser close)
    setApiKey(trimmedKey);
    setUser({ id: '0', name: 'Intervals.icu User' });
    sessionStorage.setItem(STORAGE_KEY, encodeKey(trimmedKey));
    sessionStorage.setItem(USER_KEY, JSON.stringify({ id: '0', name: 'Intervals.icu User' }));
    
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setApiKey(null);
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ apiKey, isAuthenticated: !!apiKey, isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
