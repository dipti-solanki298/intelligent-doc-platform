import React, { useState, useEffect } from 'react';
import { FileUp, CheckCircle2, Upload, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocumentCompareModal from '@/components/DocumentCompareModal';
import { ExtractedField } from '@/components/ExtractionEditor';
import { useProjectStore } from '@/stores/useProjectStore';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { config } from '@/config';
import {
    mapBackendExtractionToFrontend,
    buildPlaygroundExtractionFormData,
} from '@/lib/api-adapters/playground-adapter';

const Playground = () => {
    const { projects, fetchProjects, isLoading: projectsLoading } = useProjectStore();

    const [singleFile, setSingleFile] = useState<File | null>(null);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [extractionData, setExtractionData] = useState<ExtractedField[]>([]);
    const [fileUrl, setFileUrl] = useState<string>('');
    const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);

    // Loading states
    const [isUploading, setIsUploading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects().catch(() => {
            toast.error('Failed to load projects');
        });
    }, [fetchProjects]);

    const handleSingleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSingleFile(e.target.files[0]);
            setUploadedDocumentId(null); // Reset document ID when new file selected
        }
    };

    const handleStartExtraction = async () => {
        if (!singleFile || !selectedProject) return;

        try {
            if (config.useMockPlayground) {
                // ========== MOCK API FLOW ==========
                // Step 1: Upload document
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', singleFile);
                formData.append('projectId', selectedProject);

                const uploadResponse = await apiClient.post('/documents/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                const documentId = uploadResponse.data.id;
                setUploadedDocumentId(documentId);
                setFileUrl(URL.createObjectURL(singleFile));
                toast.success('Document uploaded successfully!');
                setIsUploading(false);

                // Step 2: Start extraction
                setIsExtracting(true);
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

                setExtractionData(extractedFields);
                setIsExtracting(false);
                setIsCompareModalOpen(true);
                toast.success('Extraction completed successfully!');

            } else {
                // ========== REAL BACKEND FLOW ==========
                setIsUploading(true);
                setIsExtracting(true);

                // Get project data to extract document type
                const projectData = projects.find((p) => p.id === selectedProject);
                const documentType = projectData?.documentType || 'PDF';

                // Build FormData for backend
                const formData = buildPlaygroundExtractionFormData(
                    selectedProject,
                    documentType,
                    singleFile
                );

                // Call combined upload + extract endpoint
                const response = await apiClient.post('/playground/extract', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // Map backend response to frontend format
                const extractedFields = mapBackendExtractionToFrontend(response.data);

                setUploadedDocumentId(response.data.file_id);
                setFileUrl(URL.createObjectURL(singleFile));
                setExtractionData(extractedFields);
                setIsUploading(false);
                setIsExtracting(false);
                setIsCompareModalOpen(true);
                toast.success('Extraction completed successfully!');
            }

        } catch (error: any) {
            setIsUploading(false);
            setIsExtracting(false);
            const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.detail ||
                'Extraction failed';
            toast.error(errorMessage);
        }
    };

    const handleUpdateField = (id: string, newValue: string) => {
        setExtractionData(prev =>
            prev.map(field => field.id === id ? { ...field, value: newValue } : field)
        );
    };

    const selectedProjectData = projects.find(p => p.id === selectedProject);
    const isExtractionDisabled = !singleFile || !selectedProject || isUploading || isExtracting;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Playground</h2>
                <p className="text-muted-foreground">Test your extraction models with single file uploads.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4">Configuration</h3>

                        <div className="space-y-4">
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
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
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
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <FileUp size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Upload Document</h3>
                                <p className="text-sm text-muted-foreground">Upload a PDF to test extraction</p>
                            </div>
                        </div>

                        <div className="flex-1 border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent/50 transition-colors relative flex flex-col items-center justify-center min-h-[300px]">
                            <Input
                                type="file"
                                accept=".pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleSingleFileUpload}
                                disabled={isUploading || isExtracting}
                            />
                            <div className="flex flex-col items-center gap-4 pointer-events-none">
                                {singleFile ? (
                                    <>
                                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg text-foreground">{singleFile.name}</p>
                                            <p className="text-sm text-muted-foreground">{(singleFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg text-foreground">Drop PDF here or click to upload</p>
                                            <p className="text-sm text-muted-foreground mt-1">Supports PDF files only</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button
                                size="lg"
                                disabled={isExtractionDisabled}
                                onClick={handleStartExtraction}
                                className="gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : isExtracting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Extracting...
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} />
                                        Run Extraction
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <DocumentCompareModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                fileUrl={fileUrl}
                fileName={singleFile?.name || ''}
                extractionData={extractionData}
                onUpdateField={handleUpdateField}
            />
        </div>
    );
};

export default Playground;
