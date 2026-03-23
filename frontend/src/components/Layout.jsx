import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/sites', label: 'Sites', icon: '🏗️' },
    { path: '/workers', label: 'Workers', icon: '👷' },
    { path: '/attendance', label: 'Attendance', icon: '📋' },
    { path: '/advances', label: 'Advances', icon: '💵' },
    { path: '/payouts', label: 'Payouts', icon: '💰' },
    { path: '/materials', label: 'Materials', icon: '🧱' },
    { path: '/milestones', label: 'Milestones', icon: '🎯' },
    { path: '/wip', label: 'Daily WIP', icon: '📝' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">
            Construction Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Command Center</p>
        </div>
        
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">
              {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
