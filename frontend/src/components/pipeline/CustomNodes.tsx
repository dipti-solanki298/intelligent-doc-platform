import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, FileText, Database, MessageSquare, Globe, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NodeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'gmail':
        case 'outlook':
            return <Mail className="w-5 h-5 text-blue-500" />;
        case 'invoice':
        case 'contract':
        case 'bank_statement':
            return <FileText className="w-5 h-5 text-green-500" />;
        case 'salesforce':
        case 'sap':
            return <Database className="w-5 h-5 text-purple-500" />;
        case 'slack':
            return <MessageSquare className="w-5 h-5 text-orange-500" />;
        case 'https_post':
            return <Globe className="w-5 h-5 text-gray-500" />;
        case 'document_compare':
            return <FileText className="w-5 h-5 text-indigo-500" />;
        default:
            return <FileText className="w-5 h-5 text-gray-500" />;
    }
};

const StatusIcon = ({ status }: { status?: string }) => {
    if (!status || status === 'idle') return null;

    switch (status) {
        case 'running':
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'success':
            return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        case 'error':
            return <XCircle className="w-4 h-4 text-red-500" />;
        default:
            return null;
    }
};

const NodeLabel = ({ type, label }: { type: string, label: string }) => {
    let typeLabel = '';
    switch (type) {
        case 'gmail': typeLabel = 'Connector'; break;
        case 'outlook': typeLabel = 'Connector'; break;
        case 'invoice': typeLabel = 'Document AI'; break;
        case 'contract': typeLabel = 'Document AI'; break;
        case 'bank_statement': typeLabel = 'Document AI'; break;
        case 'salesforce': typeLabel = 'Integration'; break;
        case 'sap': typeLabel = 'Integration'; break;
        case 'slack': typeLabel = 'Integration'; break;
        case 'https_post': typeLabel = 'Integration'; break;
        case 'document_compare': typeLabel = 'Review'; break;
        default: typeLabel = 'Node';
    }

    return (
        <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{typeLabel}</div>
            <div className="font-medium text-sm">{label}</div>
        </div>
    );
}

export const CustomNode = memo(({ data, selected }: any) => {
    return (
        <div className={cn(
            "px-4 py-3 shadow-md rounded-lg bg-card border min-w-[180px] transition-all",
            selected ? "border-primary ring-1 ring-primary" : "border-border",
            data.status === 'error' ? "border-destructive/50 bg-destructive/5" : "",
            data.status === 'success' ? "border-green-500/50 bg-green-500/5" : ""
        )}>
            <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-muted-foreground" />
            <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md relative">
                    <NodeIcon type={data.type} />
                    {data.status && data.status !== 'idle' && (
                        <div className="absolute -top-1 -right-1 bg-background rounded-full shadow-sm">
                            <StatusIcon status={data.status} />
                        </div>
                    )}
                </div>
                <NodeLabel type={data.type} label={data.label} />
            </div>
            <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-muted-foreground" />
        </div>
    );
});
