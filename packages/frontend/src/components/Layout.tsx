import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  IconDashboard,
  IconWorld,
  IconAlertTriangle,
  IconFileText,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { useThemeStore } from '@/stores/theme.store';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDark, toggle } = useThemeStore();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: IconDashboard },
    { path: '/requests', label: 'Requests', icon: IconWorld },
    { path: '/exceptions', label: 'Exceptions', icon: IconAlertTriangle },
    { path: '/logs', label: 'Logs', icon: IconFileText },
  ];

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-700 px-6">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                🔭 DevTools
              </h1>
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
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={toggle}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 min-h-screen">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

