import React, { useState, useEffect } from 'react';
import { X, Play, Trash2, AlertCircle, Upload, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/stores/useProjectStore';

interface NodeConfigPanelProps {
    selectedNode: any;
    onClose: () => void;
    onUpdate: (nodeId: string, data: any) => void;
    onDelete: (nodeId: string) => void;
    onTest: (nodeId: string) => void;
    onOpenCompare?: () => void;
    onRunExtraction?: (nodeId: string) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
    selectedNode,
    onClose,
    onUpdate,
    onDelete,
    onTest,
    onOpenCompare,
    onRunExtraction,
}) => {
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Project store for invoice/document nodes
    const { projects, fetchProjects, isLoading: projectsLoading } = useProjectStore();

    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label || '');
            setDescription(selectedNode.data.description || '');
            setUsername(selectedNode.data.username || '');
            setPassword(selectedNode.data.password || '');
        }
    }, [selectedNode]);

    // Fetch projects when showing invoice node config
    useEffect(() => {
        const isDocumentAI = ['invoice', 'contract', 'bank_statement'].includes(selectedNode?.data?.type);
        if (isDocumentAI && projects.length === 0) {
            fetchProjects();
        }
    }, [selectedNode, projects.length, fetchProjects]);

    const handleSave = () => {
        onUpdate(selectedNode.id, {
            ...selectedNode.data,
            label,
            description,
            username,
            password,
        });
    };

    const handleProjectChange = (projectId: string) => {
        onUpdate(selectedNode.id, {
            ...selectedNode.data,
            selectedProject: projectId,
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileUrl = URL.createObjectURL(file);
            onUpdate(selectedNode.id, {
                ...selectedNode.data,
                uploadedFile: file,
                fileName: file.name,
                fileSize: file.size,
                fileUrl: fileUrl,
                extractionResult: null, // Reset extraction result when new file uploaded
            });
        }
    };

    if (!selectedNode) return null;

    const isConnector = ['gmail', 'outlook'].includes(selectedNode.data.type);
    const isDocumentAI = ['invoice', 'contract', 'bank_statement'].includes(selectedNode.data.type);
    const selectedProjectData = projects.find(p => p.id === selectedNode.data.selectedProject);
    const isExtractionReady = selectedNode.data.selectedProject && selectedNode.data.uploadedFile;
    const isRunning = selectedNode.data.status === 'running';

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

                    {/* Invoice Parser / Document AI Configuration */}
                    {isDocumentAI && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">Extraction Configuration</h4>

                                {/* Project Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="project">Project</Label>
                                    {projectsLoading ? (
                                        <div className="flex items-center gap-2 p-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">Loading projects...</span>
                                        </div>
                                    ) : (
                                        <select
                                            id="project"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedNode.data.selectedProject || ''}
                                            onChange={(e) => handleProjectChange(e.target.value)}
                                        >
                                            <option value="">Select Project</option>
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Selected Project Details */}
                                {selectedProjectData && (
                                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                        <div className="text-xs font-medium text-muted-foreground">Project Details</div>
                                        <div className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Type:</span>
                                                <span className="font-medium">{selectedProjectData.documentType}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Mode:</span>
                                                <span className="font-medium">{selectedProjectData.extractionMode}</span>
                                            </div>
                                            {selectedProjectData.schema && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Fields:</span>
                                                    <span className="font-medium">{selectedProjectData.schema.length}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* File Upload Area */}
                                <div className="space-y-2">
                                    <Label>Upload Document</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-accent/50 transition-colors relative">
                                        <Input
                                            type="file"
                                            accept=".pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileUpload}
                                            disabled={isRunning}
                                        />
                                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                                            {selectedNode.data.uploadedFile ? (
                                                <>
                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-foreground">{selectedNode.data.fileName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {(selectedNode.data.fileSize / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-foreground">Drop PDF here</p>
                                                        <p className="text-xs text-muted-foreground">or click to upload</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Extraction Result Summary */}
                                {selectedNode.data.extractionResult && selectedNode.data.extractionResult.length > 0 && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {selectedNode.data.extractionResult.length} fields extracted
                                            </span>
                                        </div>
                                    </div>
                                )}
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

                {/* Run Extraction button for Document AI nodes */}
                {isDocumentAI && onRunExtraction && (
                    <Button
                        className="w-full"
                        onClick={() => onRunExtraction(selectedNode.id)}
                        disabled={!isExtractionReady || isRunning}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Extracting...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Run Extraction
                            </>
                        )}
                    </Button>
                )}

                {/* View Results button - show after successful extraction */}
                {isDocumentAI && selectedNode.data.extractionResult && onOpenCompare && (
                    <Button className="w-full" variant="secondary" onClick={onOpenCompare}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Results
                    </Button>
                )}

                <Button className="w-full" variant="outline" onClick={() => onTest(selectedNode.id)}>
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
