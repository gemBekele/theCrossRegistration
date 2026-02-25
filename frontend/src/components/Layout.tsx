import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Users, UserCog, User, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import logoBlack from '../assets/logo/4full logo black.svg';
import logoWhite from '../assets/logo/3full logo white.svg';
import iconLogo from '../assets/logo/1icon logo black.svg';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/applicants', icon: Users, label: 'Applicants' },
    { path: '/profile', icon: User, label: 'Profile' },
    ...(user?.role === 'super_admin'
      ? [{ path: '/users', icon: UserCog, label: 'Users' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={iconLogo} alt="Logo" className="w-8 h-8 object-contain dark:invert" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">The Cross</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X size={24} className="dark:text-white" /> : <Menu size={24} className="dark:text-white" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 z-30 w-64 h-screen bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-transform duration-200`}
        >
          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <img 
                src={theme === 'light' ? logoBlack : logoWhite} 
                alt="The Cross Fellowship" 
                className="h-12 w-auto object-contain hidden lg:block" 
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white lg:hidden">
                The Cross Fellowship
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Admin Dashboard</p>
            </div>
            <button
              onClick={toggleTheme}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {user?.username ? user.username[0].toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username || 'Loading...'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role ? user.role.replace('_', ' ') : ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen overflow-auto">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;