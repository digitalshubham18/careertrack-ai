import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-paper-line bg-paper-soth/90 bg-paper-soft/90 px-4 backdrop-blur dark:border-ink-line dark:bg-ink-soft/90 sm:px-6">
      <button className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-ink/60 hover:bg-paper-line/50 dark:text-paper/60 dark:hover:bg-ink-line/50"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          to="/notifications"
          className="relative rounded-xl p-2 text-ink/60 hover:bg-paper-line/50 dark:text-paper/60 dark:hover:bg-ink-line/50"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-paper-line/50 dark:hover:bg-ink-line/50"
          >
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary dark:bg-primary/20 dark:text-primary-light">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
            <ChevronDown size={14} className="hidden text-ink/40 sm:block" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 rounded-xl border border-paper-line bg-paper-soft py-1.5 shadow-lg dark:border-ink-line dark:bg-ink-soft"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm hover:bg-paper-line/50 dark:hover:bg-ink-line/50"
                onClick={() => setMenuOpen(false)}
              >
                Profile & Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
