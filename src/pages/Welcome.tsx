
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const Welcome: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Welcome to 2025
        </h1>
        
        <p className="text-gray-600 mb-6">
          You're successfully logged in as <span className="font-medium">{user?.email}</span>
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            This is your personalized dashboard. From here you can access all the features of our application.
          </p>
          
          <Button 
            onClick={logout}
            variant="outline"
            className="mt-6 flex items-center gap-2"
          >
            <LogOut size={16} />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
