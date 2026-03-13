import React from 'react';

export const Footer = () => {
  return (
    <footer className="py-8 px-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Atualização: <span className="font-semibold text-zinc-900 dark:text-zinc-100">DriverDash MultiPlataforma Entregas + Mobilidade v2.0</span>
        </p>
        <a 
          href="https://instagram.com/onoturnocsz" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium text-zinc-400 hover:text-emerald-500 transition-colors"
        >
          Sistema desenvolvido por <span className="underline">@onoturnocsz</span>
        </a>
      </div>
    </footer>
  );
};
