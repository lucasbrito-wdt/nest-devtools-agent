import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  IconDashboard,
  IconWorld,
  IconAlertTriangle,
  IconFileText,
  IconMoon,
  IconSun,
  IconClock,
  IconApi,
  IconDatabase,
  IconUsers,
  IconKeyboard,
} from '@tabler/icons-react';
import { useThemeStore } from '@/stores/theme.store';
import { useKeyboardShortcuts, KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: IconDashboard, shortcut: 'g d' },
    { path: '/requests', label: 'Requests', icon: IconWorld, shortcut: 'g r' },
    { path: '/exceptions', label: 'Exceptions', icon: IconAlertTriangle, shortcut: 'g e' },
    { path: '/logs', label: 'Logs', icon: IconFileText, shortcut: 'g l' },
    { path: '/schedule', label: 'Schedule', icon: IconClock, shortcut: 'g s' },
    { path: '/http-client', label: 'HTTP Client', icon: IconApi, shortcut: 'g h' },
    { path: '/redis', label: 'Redis', icon: IconDatabase, shortcut: 'g i' },
    { path: '/sessions', label: 'Sessions', icon: IconUsers, shortcut: 'g u' },
  ];

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    { key: 'd', description: 'Navegar para Dashboard', action: () => navigate('/') },
    { key: 'r', description: 'Navegar para Requests', action: () => navigate('/requests') },
    { key: 'e', description: 'Navegar para Exceptions', action: () => navigate('/exceptions') },
    { key: 'l', description: 'Navegar para Logs', action: () => navigate('/logs') },
    { key: 's', description: 'Navegar para Schedule', action: () => navigate('/schedule') },
    { key: 'h', description: 'Navegar para HTTP Client', action: () => navigate('/http-client') },
    { key: 'i', description: 'Navegar para Redis', action: () => navigate('/redis') },
    { key: 'u', description: 'Navegar para Sessions', action: () => navigate('/sessions') },

    // Action shortcuts
    { key: 't', description: 'Alternar tema (Dark/Light)', action: toggle },
    {
      key: '?',
      shift: true,
      description: 'Mostrar atalhos de teclado',
      action: () => setShowShortcuts(true),
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-700 px-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">🔭 DevTools</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <button
                onClick={toggle}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowShortcuts(true)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <IconKeyboard size={20} />
                      Atalhos
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Pressione <kbd className="font-mono">?</kbd> para ver todos os atalhos
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 min-h-screen">
          <div className="p-8">{children}</div>
        </main>

        {/* Keyboard Shortcuts Help Dialog */}
        <KeyboardShortcutsHelp
          open={showShortcuts}
          onOpenChange={setShowShortcuts}
          shortcuts={shortcuts}
        />
      </div>
    </div>
  );
}
