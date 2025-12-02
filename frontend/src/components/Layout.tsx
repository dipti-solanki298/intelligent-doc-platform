import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    GitCompare,
    Database,
    Settings,
    Menu,
    Bell,
    Workflow,
    LogOut,
    User,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';


const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const navItems = [
        { name: 'Prompt Studio', path: '/', icon: LayoutDashboard },
        { name: 'Playground', path: '/playground', icon: FileText },
        { name: 'Document Compare', path: '/compare', icon: GitCompare },
        { name: 'Vector Store', path: '/vector-store', icon: Database },
        { name: 'Prebuilt Workflows', path: '/workflow-automation', icon: Workflow },
        { name: 'Pipeline Builder', path: '/pipeline-builder', icon: GitCompare }, // Using GitCompare as a placeholder, ideally should be a different icon like Network or Share2
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">
                            iD
                        </div>
                        Indium Intelligent Document Platform
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer">
                        <Settings size={18} />
                        Settings
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
                    <div className="flex items-center gap-4 md:hidden">
                        <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                            <Menu size={20} />
                        </button>
                        <span className="font-bold text-lg">Indium Intelligent Document Platform</span>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <button className="p-2 text-muted-foreground hover:text-foreground relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 hover:bg-accent rounded-md px-2 py-1 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                    {getUserInitials()}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{user?.role || 'user'}</p>
                                </div>
                                <ChevronDown size={16} className="text-muted-foreground" />
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20">
                                        <div className="p-3 border-b border-border">
                                            <p className="text-sm font-medium">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>
                                        <div className="p-1">
                                            <Link
                                                to="/settings"
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <User size={16} />
                                                Profile Settings
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-destructive"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Notification Banner */}
                <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="font-medium">Intelligent Document Generation Active</span>
                        <span className="text-muted-foreground hidden sm:inline">- Processing background tasks...</span>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-muted/20">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
