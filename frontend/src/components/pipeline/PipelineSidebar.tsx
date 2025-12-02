import React from 'react';
import { Mail, FileText, Database, MessageSquare, Globe, GripVertical } from 'lucide-react';

const SidebarItem = ({ type, label, icon: Icon, category }: { type: string, label: string, icon: any, category: string }) => {
    const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', nodeLabel);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className="flex items-center gap-3 p-3 mb-2 bg-card border border-border rounded-lg cursor-grab hover:border-primary transition-colors shadow-sm"
            onDragStart={(event) => onDragStart(event, type, label)}
            draggable
        >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <div className={`p-2 rounded-md ${category === 'connector' ? 'bg-blue-500/10 text-blue-600' : category === 'docai' ? 'bg-green-500/10 text-green-600' : 'bg-purple-500/10 text-purple-600'}`}>
                <Icon size={18} />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
};

const PipelineSidebar = () => {
    return (
        <div className="w-80 border-r border-border bg-muted/30 h-full flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Pipeline Components</h2>
                <p className="text-xs text-muted-foreground mt-1">Drag and drop nodes to build your flow.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Connectors</h3>
                    <SidebarItem type="gmail" label="Gmail" icon={Mail} category="connector" />
                    <SidebarItem type="outlook" label="Outlook" icon={Mail} category="connector" />
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Document AI</h3>
                    <SidebarItem type="invoice" label="Invoice Parser" icon={FileText} category="docai" />
                    <SidebarItem type="contract" label="Contract Analyzer" icon={FileText} category="docai" />
                    <SidebarItem type="bank_statement" label="Bank Statement" icon={FileText} category="docai" />
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Integrations</h3>
                    <SidebarItem type="salesforce" label="Salesforce" icon={Database} category="integration" />
                    <SidebarItem type="sap" label="SAP S/4HANA" icon={Database} category="integration" />
                    <SidebarItem type="slack" label="Slack Notification" icon={MessageSquare} category="integration" />
                    <SidebarItem type="https_post" label="HTTPS Post" icon={Globe} category="integration" />
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Review & Validation</h3>
                    <SidebarItem type="document_compare" label="Document Compare" icon={FileText} category="review" />
                </div>
            </div>
        </div>
    );
};

export default PipelineSidebar;
