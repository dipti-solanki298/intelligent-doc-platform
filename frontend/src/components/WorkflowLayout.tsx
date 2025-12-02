import React from 'react';
import { ArrowLeft, Play, Save, History, Settings, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface WorkflowLayoutProps {
    title: string;
    subtitle?: string;
    status?: 'active' | 'draft' | 'archived';
    children: React.ReactNode;
    activeTab?: 'overview' | 'configuration' | 'history';
    onTabChange?: (tab: 'overview' | 'configuration' | 'history') => void;
}

const WorkflowLayout: React.FC<WorkflowLayoutProps> = ({
    title,
    subtitle,
    status = 'draft',
    children,
    activeTab = 'overview',
    onTabChange
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full bg-muted/20 -m-6">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/workflow-automation')}
                        className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold">{title}</h1>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                                status === 'active' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            )}>
                                {status}
                            </span>
                        </div>
                        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-accent rounded-md transition-colors">
                            <Save size={16} />
                            Save Draft
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors shadow-sm">
                            <Play size={16} />
                            Run Workflow
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 -mb-4">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'configuration', label: 'Configuration', icon: Settings },
                        { id: 'history', label: 'Run History', icon: History },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default WorkflowLayout;
