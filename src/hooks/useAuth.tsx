import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Mock User 
interface User {
  uid: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Always return a mock user so we skip login
  const [user, setUser] = useState<User | null>({ uid: 'mock-123', email: 'farmer@example.com' });
  const [loading, setLoading] = useState(false);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
