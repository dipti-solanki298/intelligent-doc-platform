import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Download, Bot, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ExtractedField {
    id: string;
    key: string;
    value: string;
    confidence: number;
    pageRef: number;
}

interface ExtractionEditorProps {
    data: ExtractedField[];
    onUpdate: (id: string, newValue: string) => void;
}

const ExtractionEditor: React.FC<ExtractionEditorProps> = ({ data, onUpdate }) => {
    const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

    const handleFeedback = (id: string, type: 'up' | 'down') => {
        setFeedback(prev => ({
            ...prev,
            [id]: prev[id] === type ? null : type
        }));
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 0.9) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 0.7) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const handleDownload = () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "extraction_results.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAgentAssist = () => {
        // Mock agent automation
        alert("Agent Assist: Auto-correcting low confidence fields based on historical data...");
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50">
                <div>
                    <h3 className="font-semibold text-lg">Extraction Results</h3>
                    <p className="text-sm text-muted-foreground">Review and edit extracted values</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAgentAssist}>
                        <Bot className="mr-2 h-4 w-4" />
                        Agent Assist
                    </Button>
                    <Button size="sm" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download JSON
                    </Button>
                </div>
            </div>

            {/* Fields List */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {data.map((field) => (
                    <div key={field.id} className="group relative bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between mb-2">
                            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {field.key}
                            </Label>
                            <div className={cn("px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1", getConfidenceColor(field.confidence))}>
                                {field.confidence >= 0.9 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                {Math.round(field.confidence * 100)}%
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Input
                                value={field.value}
                                onChange={(e) => onUpdate(field.id, e.target.value)}
                                className="font-medium"
                            />

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleFeedback(field.id, 'up')}
                                    className={cn(
                                        "p-2 rounded-md hover:bg-accent transition-colors",
                                        feedback[field.id] === 'up' ? "text-green-600 bg-green-50" : "text-muted-foreground"
                                    )}
                                >
                                    <ThumbsUp size={16} />
                                </button>
                                <button
                                    onClick={() => handleFeedback(field.id, 'down')}
                                    className={cn(
                                        "p-2 rounded-md hover:bg-accent transition-colors",
                                        feedback[field.id] === 'down' ? "text-red-600 bg-red-50" : "text-muted-foreground"
                                    )}
                                >
                                    <ThumbsDown size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Page {field.pageRef}</span>
                            <span className="cursor-pointer hover:underline text-primary">Show in PDF</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExtractionEditor;
