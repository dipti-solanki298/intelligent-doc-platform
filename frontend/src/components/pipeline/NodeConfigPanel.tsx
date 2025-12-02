import React, { useState, useEffect } from 'react';
import { X, Play, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NodeConfigPanelProps {
    selectedNode: any;
    onClose: () => void;
    onUpdate: (nodeId: string, data: any) => void;
    onDelete: (nodeId: string) => void;
    onTest: (nodeId: string) => void;
    onOpenCompare?: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
    selectedNode,
    onClose,
    onUpdate,
    onDelete,
    onTest,
    onOpenCompare,
}) => {
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label || '');
            setDescription(selectedNode.data.description || '');
            setUsername(selectedNode.data.username || '');
            setPassword(selectedNode.data.password || '');
        }
    }, [selectedNode]);

    const handleSave = () => {
        onUpdate(selectedNode.id, {
            ...selectedNode.data,
            label,
            description,
            username,
            password,
        });
    };

    if (!selectedNode) return null;

    const isConnector = ['gmail', 'outlook'].includes(selectedNode.data.type);

    return (
        <div className="w-80 border-l border-border bg-card h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-300 absolute right-0 top-0 z-10">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-semibold text-lg">Configuration</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="label">Node Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onBlur={handleSave}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleSave}
                            placeholder="Describe the purpose of this node..."
                            className="resize-none"
                        />
                    </div>

                    {isConnector && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Authentication</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username / Email</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        onBlur={handleSave}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password / API Key</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={handleSave}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {selectedNode.data.status === 'error' && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <div className="font-medium">Execution Failed</div>
                                <div className="text-xs opacity-90 mt-1">
                                    {selectedNode.data.errorMessage || "An unknown error occurred during execution."}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-muted/30 space-y-2">
                {selectedNode.data.type === 'document_compare' && onOpenCompare && (
                    <Button className="w-full" variant="secondary" onClick={onOpenCompare}>
                        <Play className="w-4 h-4 mr-2" />
                        Open Comparison View
                    </Button>
                )}
                <Button className="w-full" onClick={() => onTest(selectedNode.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Test Node
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => onDelete(selectedNode.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Node
                </Button>
            </div>
        </div>
    );
};

export default NodeConfigPanel;
