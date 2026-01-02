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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedKey = localStorage.getItem('intervals_api_key');
    const storedUser = localStorage.getItem('intervals_user');
    
    if (storedKey) {
      setApiKey(storedKey);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Validate key with Intervals.icu API
      // Using 'api' as password is the standard for Basic Auth with API keys in Intervals.icu
      const response = await fetch('https://intervals.icu/api/v1/athlete/0', {
        headers: {
          'Authorization': 'Basic ' + btoa(key + ':api')
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setApiKey(key);
        setUser(userData);
        localStorage.setItem('intervals_api_key', key);
        localStorage.setItem('intervals_user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setApiKey(null);
    setUser(null);
    localStorage.removeItem('intervals_api_key');
    localStorage.removeItem('intervals_user');
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
