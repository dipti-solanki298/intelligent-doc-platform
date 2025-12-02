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
import DocumentCompare from '@/pages/DocumentCompare';
import { X, FileText } from 'lucide-react';

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

    const handleRun = async () => {
        toast.info('Starting pipeline execution...');

        // Reset statuses
        setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })));

        // Simulate execution
        for (const node of nodes) {
            // Set running
            updateNodeData(node.id, { status: 'running' });

            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

            // Random failure for demonstration
            const isSuccess = Math.random() > 0.2;

            if (isSuccess) {
                updateNodeData(node.id, { status: 'success' });
            } else {
                updateNodeData(node.id, {
                    status: 'error',
                    errorMessage: 'Connection timeout: Failed to reach external service.'
                });
                toast.error(`Pipeline failed at node: ${node.data.label}`);
                break; // Stop execution on failure
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
        setIsCompareOpen(true);
    };

    return (
        <div className="flex h-screen w-full bg-background relative overflow-hidden">
            {isCompareOpen && (
                <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200">
                    <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
                        <div className="font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Document Comparison
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsCompareOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <DocumentCompare />
                    </div>
                </div>
            )}

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
