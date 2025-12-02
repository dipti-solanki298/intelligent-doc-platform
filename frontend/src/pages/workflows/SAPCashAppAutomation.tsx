import React, { useState } from 'react';
import WorkflowLayout from '@/components/WorkflowLayout';
import WorkflowNode, { NodeStatus } from '@/components/WorkflowNode';
import LLMSelector from '@/components/LLMSelector';
import {
    Landmark,
    ScanText,
    GitMerge,
    UserCheck,
    Database,
    PieChart
} from 'lucide-react';

const SAPCashAppAutomation = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'configuration' | 'history'>('overview');
    const [selectedLLM, setSelectedLLM] = useState<string>('');

    const steps = [
        {
            id: 'payment-receipt',
            title: 'Payment Receipt (MT940)',
            description: 'Import bank statements and lockbox files from SAP Multi-Bank Connectivity.',
            icon: Landmark,
            status: 'completed' as NodeStatus,
            type: 'trigger' as const
        },
        {
            id: 'advice-extraction',
            title: 'Remittance Advice Extraction',
            description: 'OCR extraction from PDF/Email remittance advices.',
            icon: ScanText,
            status: 'completed' as NodeStatus,
            type: 'action' as const
        },
        {
            id: 'matching',
            title: 'Invoice Matching (ML)',
            description: 'Match payments to open AR invoices using machine learning algorithms.',
            icon: GitMerge,
            status: 'active' as NodeStatus,
            type: 'decision' as const
        },
        {
            id: 'exception',
            title: 'Exception Handling',
            description: 'Manual review queue for partial matches or missing remittance.',
            icon: UserCheck,
            status: 'pending' as NodeStatus,
            type: 'action' as const
        },
        {
            id: 'clearing',
            title: 'SAP S/4HANA Clearing',
            description: 'Post clearing documents and update General Ledger.',
            icon: Database,
            status: 'pending' as NodeStatus,
            type: 'action' as const
        }
    ];

    return (
        <WorkflowLayout
            title="SAP Cash Application"
            subtitle="Automated invoice matching and clearing for Accounts Receivable"
            status="active"
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Workflow Pipeline */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-semibold mb-6">Pipeline Visualization</h2>
                        <div className="pl-4">
                            {steps.map((step, index) => (
                                <WorkflowNode
                                    key={step.id}
                                    {...step}
                                    isLast={index === steps.length - 1}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card p-4 rounded-xl border border-border">
                            <p className="text-sm text-muted-foreground">Auto-Match Rate</p>
                            <p className="text-2xl font-bold text-green-600">94.2%</p>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-border">
                            <p className="text-sm text-muted-foreground">DSO Impact</p>
                            <p className="text-2xl font-bold text-blue-600">-3.5 Days</p>
                        </div>
                        <div className="bg-card p-4 rounded-xl border border-border">
                            <p className="text-sm text-muted-foreground">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-600">12</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Configuration / Details */}
                <div className="space-y-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4">Matching Configuration</h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <div className="flex items-center gap-2 text-purple-600 font-medium mb-2">
                                    <GitMerge size={18} />
                                    Active Matching Job
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Processing batch <strong>#BATCH-2024-11-21</strong>. 450/500 items matched.
                                </p>
                                <div className="w-full bg-purple-200 rounded-full h-1.5">
                                    <div className="bg-purple-600 h-1.5 rounded-full w-[90%]"></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <LLMSelector
                                    value={selectedLLM}
                                    onChange={setSelectedLLM}
                                    label="Extraction Model"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Matching Strategy</label>
                                <div className="flex gap-2">
                                    <button className="flex-1 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-md">
                                        Standard
                                    </button>
                                    <button className="flex-1 px-3 py-2 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground rounded-md">
                                        FIFO
                                    </button>
                                    <button className="flex-1 px-3 py-2 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground rounded-md">
                                        Exact Amount
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tolerance Limit</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <input type="number" className="w-full h-9 rounded-md border border-input bg-background pl-6 pr-3 text-sm" defaultValue="5.00" />
                                </div>
                                <p className="text-xs text-muted-foreground">Differences under $5.00 will be automatically written off.</p>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-medium mb-2">SAP Connection</h3>
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 px-3 py-2 rounded-md">
                                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                    Connected to S/4HANA (Prod)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WorkflowLayout>
    );
};

export default SAPCashAppAutomation;
