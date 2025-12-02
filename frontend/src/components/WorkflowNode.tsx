import React from 'react';
import { LucideIcon, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeStatus = 'completed' | 'active' | 'pending' | 'error';
export type NodeType = 'trigger' | 'action' | 'decision';

interface WorkflowNodeProps {
    title: string;
    description?: string;
    icon: LucideIcon;
    status: NodeStatus;
    type?: NodeType;
    isLast?: boolean;
    onClick?: () => void;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
    title,
    description,
    icon: Icon,
    status,
    type = 'action',
    isLast = false,
    onClick
}) => {
    const getStatusColor = (status: NodeStatus) => {
        switch (status) {
            case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'active': return 'text-blue-500 bg-blue-500/10 border-blue-500/20 ring-2 ring-blue-500/20';
            case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    const getStatusIcon = (status: NodeStatus) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'active': return <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />;
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            default: return <Circle size={16} className="text-muted-foreground" />;
        }
    };

    return (
        <div className="relative flex gap-4">
            {/* Connector Line */}
            {!isLast && (
                <div className="absolute left-6 top-12 bottom-[-24px] w-0.5 bg-border" />
            )}

            {/* Icon Bubble */}
            <div className={cn(
                "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300",
                getStatusColor(status),
                status === 'active' && "scale-110"
            )}>
                <Icon size={20} />
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                    {getStatusIcon(status)}
                </div>
            </div>

            {/* Content Card */}
            <div
                onClick={onClick}
                className={cn(
                    "flex-1 mb-8 p-4 rounded-xl border bg-card transition-all duration-200 hover:shadow-md cursor-pointer group",
                    status === 'active' ? "border-blue-500/30 shadow-sm" : "border-border"
                )}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className={cn(
                            "font-semibold text-sm mb-1 group-hover:text-primary transition-colors",
                            status === 'active' ? "text-foreground" : "text-foreground/80"
                        )}>
                            {title}
                        </h3>
                        {description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        {type.toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowNode;
