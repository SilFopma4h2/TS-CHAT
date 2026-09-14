'use client';

import React, { useState } from 'react';
import { AuthMode, UserType } from '@/types/chat';
import { USERS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedUser, setSelectedUser] = useState<UserType>('sil');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Eenvoudige mock validatie
    if (mode === 'login') {
      onLogin(selectedUser);
    } else {
      // Mock register flow
      onLogin(selectedUser);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Auth Card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl shadow-lg shadow-emerald-950/40">
            TS
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">TS-CHAT</h1>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Privé realtime chatapplicatie voor Sil en Twan op de Raspberry Pi 3
          </p>
        </div>

        {/* Tab switch: Inloggen vs Registreren */}
        <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Inloggen
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Registreren
          </button>
        </div>

        {/* Quick User Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Selecteer je profiel:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(['sil', 'twan'] as const).map((userId) => {
              const profile = USERS[userId];
              const isSelected = selectedUser === userId;

              return (
                <button
                  key={userId}
                  type="button"
                  onClick={() => setSelectedUser(userId)}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/90 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1.5 shadow-sm ${profile.accentColor}`}
                  >
                    {profile.avatarInitials}
                  </div>
                  <span className="text-xs font-bold text-zinc-100">{profile.name}</span>
                  <span className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    {profile.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Pincode of Wachtwoord (Mock):
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-semibold shadow-lg shadow-emerald-950/40"
          >
            {mode === 'login' ? `Inloggen als ${USERS[selectedUser].name}` : `Registreren als ${USERS[selectedUser].name}`}
          </Button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-zinc-800/80">
          <p className="text-[11px] text-zinc-500">
            TS-CHAT MVP • Geen externe authenticatie vereist
          </p>
        </div>
      </div>
    </div>
  );
};
