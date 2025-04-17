
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Types for our authentication context
interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock database for this demo (in a real app, this would be a backend service)
interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
}

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Helper function to simulate password hashing (in a real app, use bcrypt or similar)
  const hashPassword = (password: string): string => {
    // WARNING: This is NOT a real password hash - just a simulation for the demo
    // In a real app, use a proper hashing library like bcrypt
    return btoa(password);
  };

  // Helper function to get users from localStorage
  const getUsers = (): StoredUser[] => {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : [];
  };

  // Save users to localStorage
  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Normalize email address
      const normalizedEmail = email.toLowerCase().trim();
      
      // Get users from localStorage
      const users = getUsers();
      
      // Find the user with the matching email
      const foundUser = users.find(u => u.email === normalizedEmail);
      
      if (!foundUser) {
        toast.error("No account found with this email.");
        return false;
      }
      
      // Check if password matches
      if (foundUser.passwordHash !== hashPassword(password)) {
        toast.error("Incorrect password. Please try again.");
        return false;
      }
      
      // Set the user in state
      const authenticatedUser = { id: foundUser.id, email: foundUser.email };
      setUser(authenticatedUser);
      
      // Store in localStorage for persistence
      localStorage.setItem("currentUser", JSON.stringify(authenticatedUser));
      
      toast.success("Login successful!");
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Normalize email address
      const normalizedEmail = email.toLowerCase().trim();
      
      // Get current users
      const users = getUsers();
      
      // Check if email is already registered
      if (users.some(user => user.email === normalizedEmail)) {
        toast.error("This email is already registered. Please log in or use a different email.");
        return false;
      }
      
      // Create new user
      const newUser: StoredUser = {
        id: Date.now().toString(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
      };
      
      // Add to users array and save
      users.push(newUser);
      saveUsers(users);
      
      toast.success("Account created successfully! Please log in.");
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    toast.info("You have been logged out.");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
