import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
export const Header = () => {
  const {
    user,
    signOut
  } = useAuth();
  return <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900">
            Criador de Histórias
          </h1>
          {user && <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="bg-indigo-50 text-zinc-950">
                Sair
              </Button>
            </div>}
        </div>
      </div>
    </header>;
};