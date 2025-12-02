import React from 'react';
import { ArrowRight, FileText, Settings, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const WorkflowAutomation = () => {
    const navigate = useNavigate();

    const workflows = [
        {
            id: 'claim-automation',
            title: 'Healthcare Claim Automation',
            description: 'End-to-end processing for HCFA-1500 and UB-04 claims (Eligibility, Coding, Adjudication).',
            icon: FileText,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            path: '/workflow-automation/healthcare-claim'
        },
        {
            id: 'invoice-sap',
            title: 'SAP Cash Application',
            description: 'Automated invoice matching and clearing for Accounts Receivable in SAP S/4HANA.',
            icon: Settings,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            path: '/workflow-automation/sap-cash-app'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Prebuilt Workflows</h1>
                <p className="text-muted-foreground mt-2">
                    Select a pre-configured workflow to automate your business processes.
                </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    Prebuilt Flows
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            onClick={() => navigate(workflow.path)}
                            className={cn(
                                "group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer",
                                workflow.borderColor
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("p-3 rounded-lg", workflow.bgColor, workflow.color)}>
                                    <workflow.icon size={24} />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                        <ArrowRight size={16} />
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                {workflow.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-6">
                                {workflow.description}
                            </p>

                            <div className="flex items-center gap-3">
                                <button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Play size={14} />
                                    Start Flow
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(workflow.path);
                                    }}
                                    className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Configure
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorkflowAutomation;
