import React, { useState, useRef, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Connection,
    Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import PipelineSidebar from '@/components/pipeline/PipelineSidebar';
import { CustomNode } from '@/components/pipeline/CustomNodes';
import NodeConfigPanel from '@/components/pipeline/NodeConfigPanel';
import DocumentCompareModal from '@/components/DocumentCompareModal';
import { ExtractedField } from '@/components/ExtractionEditor';
import { useProjectStore } from '@/stores/useProjectStore';
import apiClient from '@/lib/api-client';
import { config } from '@/config';
import {
    mapBackendExtractionToFrontend,
    buildPlaygroundExtractionFormData,
} from '@/lib/api-adapters/playground-adapter';

const nodeTypes = {
    custom: CustomNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const PipelineBuilderContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    // Extraction result state for DocumentCompareModal
    const [extractionData, setExtractionData] = useState<ExtractedField[]>([]);
    const [extractionFileUrl, setExtractionFileUrl] = useState<string>('');
    const [extractionFileName, setExtractionFileName] = useState<string>('');

    const { projects } = useProjectStore();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type: 'custom',
                position,
                data: { label: label, type: type, status: 'idle' },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                selected: n.id === node.id,
            }))
        );
    }, [setNodes]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    }, [setNodes]);

    const updateNodeData = (nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    const updatedNode = { ...node, data: { ...node.data, ...newData } };
                    if (selectedNode?.id === nodeId) {
                        setSelectedNode(updatedNode);
                    }
                    return updatedNode;
                }
                return node;
            })
        );
    };

    const deleteNode = (nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setSelectedNode(null);
    };

    const handleSave = () => {
        console.log('Saving pipeline:', { nodes, edges });
        toast.success('Pipeline saved successfully');
    };

    // Execute extraction for a single invoice/document AI node
    const executeInvoiceExtraction = async (nodeId: string): Promise<boolean> => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return false;

        const { selectedProject, uploadedFile, fileName, fileUrl } = node.data;

        if (!selectedProject || !uploadedFile) {
            toast.error('Please select a project and upload a file');
            return false;
        }

        // Get project data
        const projectData = projects.find((p) => p.id === selectedProject);
        const documentType = projectData?.documentType || 'PDF';

        try {
            if (config.useMockPlayground) {
                // ========== MOCK API FLOW ==========
                // Step 1: Upload document
                const formData = new FormData();
                formData.append('file', uploadedFile);
                formData.append('projectId', selectedProject);

                const uploadResponse = await apiClient.post('/documents/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                const documentId = uploadResponse.data.id;

                // Step 2: Start extraction
                const extractionResponse = await apiClient.post(`/documents/${documentId}/extract`, {
                    projectId: selectedProject,
                });

                // Step 3: Convert extraction results to ExtractedField format
                const results = extractionResponse.data.results;
                const extractedFields: ExtractedField[] = Object.entries(results).map(([key, value], index) => ({
                    id: String(index + 1),
                    key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: String(value),
                    confidence: extractionResponse.data.confidence || 0.85,
                    pageRef: 1,
                }));

                // Store results in node data
                updateNodeData(nodeId, {
                    extractionResult: extractedFields,
                    status: 'success',
                });

                return true;

            } else {
                // ========== REAL BACKEND FLOW ==========
                console.log('🚀 Starting real backend extraction for node:', nodeId);
                console.log('  - Project ID:', selectedProject);
                console.log('  - Document Type:', documentType);
                console.log('  - File:', fileName);

                // Build FormData for backend
                const formData = buildPlaygroundExtractionFormData(
                    selectedProject,
                    documentType,
                    uploadedFile
                );

                console.log('  - FormData built, calling /playground/extract...');

                // Call combined upload + extract endpoint
                const response = await apiClient.post('/playground/extract', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                console.log('✅ Backend response received:', response.data);

                // Map backend response to frontend format
                const extractedFields = mapBackendExtractionToFrontend(response.data);

                console.log('✅ Mapped to', extractedFields.length, 'fields');

                // Store results in node data
                updateNodeData(nodeId, {
                    extractionResult: extractedFields,
                    status: 'success',
                });

                return true;
            }

        } catch (error: any) {
            console.error('❌ Extraction failed:', error);
            const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.detail ||
                error.message ||
                'Extraction failed';

            updateNodeData(nodeId, {
                status: 'error',
                errorMessage: errorMessage,
            });

            return false;
        }
    };

    // Handle Run Extraction from NodeConfigPanel
    const handleRunExtraction = async (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Set running status
        updateNodeData(nodeId, { status: 'running' });
        toast.info('Starting extraction...');

        const success = await executeInvoiceExtraction(nodeId);

        if (success) {
            toast.success('Extraction completed successfully!');

            // Open the compare modal to show results
            const updatedNode = nodes.find(n => n.id === nodeId);
            if (updatedNode?.data.extractionResult) {
                setExtractionData(updatedNode.data.extractionResult);
                setExtractionFileUrl(updatedNode.data.fileUrl || '');
                setExtractionFileName(updatedNode.data.fileName || 'document.pdf');
                setIsCompareOpen(true);
            }
        } else {
            toast.error('Extraction failed. Check node for details.');
        }
    };

    const handleRun = async () => {
        toast.info('Starting pipeline execution...');

        // Reset statuses
        setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })));

        // Execute nodes in order
        for (const node of nodes) {
            const isDocumentAI = ['invoice', 'contract', 'bank_statement'].includes(node.data.type);

            // Set running
            updateNodeData(node.id, { status: 'running' });

            if (isDocumentAI) {
                // Run actual extraction for document AI nodes
                const success = await executeInvoiceExtraction(node.id);

                if (!success) {
                    toast.error(`Pipeline failed at node: ${node.data.label}`);
                    break;
                }
            } else {
                // Simulate work for other node types
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Random failure for demonstration (for non-document nodes)
                const isSuccess = Math.random() > 0.2;

                if (isSuccess) {
                    updateNodeData(node.id, { status: 'success' });
                } else {
                    updateNodeData(node.id, {
                        status: 'error',
                        errorMessage: 'Connection timeout: Failed to reach external service.'
                    });
                    toast.error(`Pipeline failed at node: ${node.data.label}`);
                    break;
                }
            }
        }

        toast.success('Pipeline execution finished');
    };

    const handleTestNode = async (nodeId: string) => {
        updateNodeData(nodeId, { status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateNodeData(nodeId, { status: 'success' });
        toast.success('Node test passed');
    };

    const handleClear = () => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
    };

    const handleOpenCompare = () => {
        // If there's a selected node with extraction results, use those
        if (selectedNode?.data.extractionResult) {
            setExtractionData(selectedNode.data.extractionResult);
            setExtractionFileUrl(selectedNode.data.fileUrl || '');
            setExtractionFileName(selectedNode.data.fileName || 'document.pdf');
        }
        setIsCompareOpen(true);
    };

    const handleUpdateExtractionField = (id: string, newValue: string) => {
        setExtractionData(prev =>
            prev.map(field => field.id === id ? { ...field, value: newValue } : field)
        );

        // Also update the node data if there's a selected node
        if (selectedNode) {
            const updatedExtractionResult = selectedNode.data.extractionResult?.map(
                (field: ExtractedField) => field.id === id ? { ...field, value: newValue } : field
            );
            updateNodeData(selectedNode.id, { extractionResult: updatedExtractionResult });
        }
    };

    return (
        <div className="flex h-screen w-full bg-background relative overflow-hidden">
            {/* Document Compare Modal */}
            <DocumentCompareModal
                isOpen={isCompareOpen}
                onClose={() => setIsCompareOpen(false)}
                fileUrl={extractionFileUrl}
                fileName={extractionFileName}
                extractionData={extractionData}
                onUpdateField={handleUpdateExtractionField}
            />

            <PipelineSidebar />

            <div className="flex-1 h-full flex flex-col">
                <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
                    <div className="font-semibold">New Pipeline</div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleClear}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                        <Button size="sm" onClick={handleRun}>
                            <Play className="w-4 h-4 mr-2" />
                            Run
                        </Button>
                    </div>
                </div>

                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-background"
                    >
                        <Controls />
                        <MiniMap />
                        <Background gap={12} size={1} />
                    </ReactFlow>
                </div>
            </div>

            {selectedNode && (
                <NodeConfigPanel
                    selectedNode={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onUpdate={updateNodeData}
                    onDelete={deleteNode}
                    onTest={handleTestNode}
                    onOpenCompare={handleOpenCompare}
                    onRunExtraction={handleRunExtraction}
                />
            )}
        </div>
    );
};

const PipelineBuilder = () => {
    return (
        <ReactFlowProvider>
            <PipelineBuilderContent />
        </ReactFlowProvider>
    );
};

export default PipelineBuilder;
