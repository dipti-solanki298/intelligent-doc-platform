import React, { useState } from 'react';
import WorkflowLayout from '@/components/WorkflowLayout';
import WorkflowNode, { NodeStatus } from '@/components/WorkflowNode';
import LLMSelector from '@/components/LLMSelector';
import {
    FileInput,
    ShieldCheck,
    Stethoscope,
    Scale,
    Banknote,
    FileText,
    AlertTriangle
} from 'lucide-react';

const HealthcareClaimAutomation = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'configuration' | 'history'>('overview');
    const [selectedLLM, setSelectedLLM] = useState<string>('');

    const steps = [
        {
            id: 'submission',
            title: 'Claim Submission (837)',
            description: 'Ingest electronic claims in EDI 837 format from provider portals.',
            icon: FileInput,
            status: 'completed' as NodeStatus,
            type: 'trigger' as const
        },
        {
            id: 'eligibility',
            title: 'Eligibility Verification (270/271)',
            description: 'Real-time check of patient coverage and benefits.',
            icon: ShieldCheck,
            status: 'completed' as NodeStatus,
            type: 'action' as const
        },
        {
            id: 'coding',
            title: 'Medical Coding (AI)',
            description: 'Validate CPT and ICD-10 codes against clinical documentation using MedBERT.',
            icon: Stethoscope,
            status: 'active' as NodeStatus,
            type: 'action' as const
        },
        {
            id: 'adjudication',
            title: 'Adjudication Engine',
            description: 'Apply payer policies and determine reimbursement amount.',
            icon: Scale,
            status: 'pending' as NodeStatus,
            type: 'decision' as const
        },
        {
            id: 'payment',
            title: 'Payment & Remittance (835)',
            description: 'Generate EFT payment and Electronic Remittance Advice.',
            icon: Banknote,
            status: 'pending' as NodeStatus,
            type: 'action' as const
        }
    ];

    return (
        <WorkflowLayout
            title="Healthcare Claim Automation"
            subtitle="End-to-end processing for HCFA-1500 and UB-04 claims"
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
                </div>

                {/* Right Column: Configuration / Details */}
                <div className="space-y-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4">Current Step Details</h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                                    <Stethoscope size={18} />
                                    Medical Coding
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    AI model is analyzing clinical notes to validate CPT code <strong>99213</strong>.
                                </p>
                                <div className="w-full bg-blue-200 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full w-[65%]"></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Processing...</span>
                                    <span>65%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <LLMSelector
                                    value={selectedLLM}
                                    onChange={setSelectedLLM}
                                    label="Medical Coding Model"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confidence Threshold</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" className="flex-1" />
                                    <span className="text-sm font-mono">85%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-yellow-500" />
                            Recent Alerts
                        </h2>
                        <div className="space-y-3">
                            <div className="text-sm border-l-2 border-yellow-500 pl-3 py-1">
                                <p className="font-medium">Eligibility Mismatch</p>
                                <p className="text-muted-foreground text-xs">Claim #4922: Patient DOB mismatch with payer records.</p>
                            </div>
                            <div className="text-sm border-l-2 border-red-500 pl-3 py-1">
                                <p className="font-medium">Coding Denial Risk</p>
                                <p className="text-muted-foreground text-xs">High probability of denial for modifier -25 usage.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </WorkflowLayout>
    );
};

export default HealthcareClaimAutomation;
