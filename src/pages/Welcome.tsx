
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import NotionRenderer from "@/components/NotionRenderer";

const Welcome: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  console.log("Current authenticated user:", user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Your Dashboard
          </h1>
          <Button 
            onClick={logout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Log out
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {user.email && (
            <>
              <div className="mb-4 text-gray-500 text-sm">
                Logged in as: {user.email}
              </div>
              <NotionRenderer userId={user.email} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
