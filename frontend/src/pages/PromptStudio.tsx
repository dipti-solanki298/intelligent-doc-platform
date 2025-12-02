import React, { useState, useEffect } from 'react';
import { Plus, Folder, FileText, Search, Trash2, Loader2 } from 'lucide-react';
import { Button, Input, Label, Select, Dialog } from '@/components/ui';
import LLMSelector from '@/components/LLMSelector';
import { DocumentType, ExtractionMode } from '@/types';
import { useProjectStore } from '@/stores/useProjectStore';
import { toast } from 'sonner';

const CONTRACT_FIELDS_PRESET = [
    { id: '1', key: 'contract_title', description: 'Extract the full legal title of the contract.', type: 'string', required: true },
    { id: '2', key: 'effective_date', description: 'Identify the effective date of the contract.', type: 'date', required: true },
    { id: '3', key: 'expiration_date', description: 'Identify the expiration date or end date of the contract term.', type: 'date', required: false },
    { id: '4', key: 'parties_involved', description: 'List all parties involved with their roles.', type: 'array', required: true },
    { id: '5', key: 'contract_value', description: 'Extract the total value or monetary consideration of the contract.', type: 'string', required: false },
    { id: '6', key: 'payment_terms', description: 'Extract payment schedules, due dates, and penalties.', type: 'string', required: false },
    { id: '7', key: 'termination_clause', description: 'Extract conditions for termination, notice periods, and penalties.', type: 'string', required: false },
    { id: '8', key: 'governing_law', description: 'Identify the governing law or jurisdiction.', type: 'string', required: false },
    { id: '9', key: 'confidentiality_clause', description: 'Extract confidentiality obligations and duration.', type: 'string', required: false },
    { id: '10', key: 'indemnification', description: 'Extract indemnification clauses and scope.', type: 'string', required: false },
    { id: '11', key: 'limitation_of_liability', description: 'Extract limitations on liability, including caps and exclusions.', type: 'string', required: false },
    { id: '12', key: 'force_majeure', description: 'Extract force majeure events and consequences.', type: 'string', required: false },
    { id: '13', key: 'dispute_resolution', description: 'Extract dispute resolution mechanisms (arbitration, mediation, courts).', type: 'string', required: false },
    { id: '14', key: 'renewal_terms', description: 'Extract automatic renewal clauses and notice periods.', type: 'string', required: false },
    { id: '15', key: 'exclusivity', description: 'Extract any exclusivity or non-compete clauses.', type: 'string', required: false },
    { id: '16', key: 'warranties', description: 'Extract representations and warranties made by parties.', type: 'string', required: false },
    { id: '17', key: 'assignment', description: 'Extract conditions for assigning the contract to third parties.', type: 'string', required: false },
    { id: '18', key: 'notices', description: 'Extract address and method for sending legal notices.', type: 'string', required: false },
    { id: '19', key: 'severability', description: 'Extract severability clause.', type: 'string', required: false },
    { id: '20', key: 'entire_agreement', description: 'Extract the entire agreement / integration clause.', type: 'string', required: false },
];

const PromptStudio = () => {
    const { projects, fetchProjects, getProject, createProject, updateProject, deleteProject, isLoading, error, clearError } = useProjectStore();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    // New Project Form State
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectType, setNewProjectType] = useState<DocumentType>('PDF');
    const [newProjectMode, setNewProjectMode] = useState<ExtractionMode>('Field Extraction');
    const [domainTemplate, setDomainTemplate] = useState<string>('Custom');
    const [selectedLLM, setSelectedLLM] = useState<string>('');

    // Schema File Upload State
    const [schemaFile, setSchemaFile] = useState<File | null>(null);
    const [schemaFileError, setSchemaFileError] = useState<string>('');

    // Contract Schema State (for creation)
    const [contractFields, setContractFields] = useState(CONTRACT_FIELDS_PRESET.map(f => ({ ...f, enabled: true })));

    // Edit Project State
    const [editingProject, setEditingProject] = useState<any>(null);
    const [editingSchema, setEditingSchema] = useState<any[]>([]);
    const [editSchemaFile, setEditSchemaFile] = useState<File | null>(null);

    // Fetch projects on mount
    useEffect(() => {
        fetchProjects().catch(() => {
            toast.error('Failed to load projects');
        });
    }, [fetchProjects]);

    // Clear errors when they appear
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    // Handle schema file upload
    const handleSchemaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            setSchemaFileError('Please upload a JSON file');
            setSchemaFile(null);
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            setSchemaFileError('File size must be less than 1MB');
            setSchemaFile(null);
            return;
        }

        try {
            // Read and validate JSON
            const text = await file.text();
            const parsed = JSON.parse(text);

            if (typeof parsed !== 'object' || parsed === null) {
                setSchemaFileError('JSON must be an object');
                setSchemaFile(null);
                return;
            }

            setSchemaFile(file);
            setSchemaFileError('');
            toast.success('Schema file loaded successfully');
        } catch (error) {
            setSchemaFileError('Invalid JSON file');
            setSchemaFile(null);
            toast.error('Failed to parse JSON file');
        }
    };

    const handleEditSchemaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json')) {
            toast.error('Please upload a JSON file');
            return;
        }

        try {
            const text = await file.text();
            JSON.parse(text); // Validate JSON
            setEditSchemaFile(file);
            toast.success('Schema file loaded successfully');
        } catch (error) {
            toast.error('Invalid JSON file');
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalExtractionMode = newProjectMode;
        let finalDescription = newProjectDesc;
        let finalSchema: any[] = [];

        // Prefixed workflow for Contract documents
        if (domainTemplate === 'Contract') {
            finalExtractionMode = 'Hybrid';
            if (!finalDescription) {
                finalDescription = 'Automated extraction for Contract documents using LLM.';
            }
            finalSchema = contractFields.filter(f => f.enabled).map(({ enabled, ...rest }) => rest);
        }

        const projectData = {
            name: newProjectName,
            description: finalDescription,
            documentType: newProjectType,
            extractionMode: finalExtractionMode,
            schema: finalSchema,
            llmConfig: selectedLLM ? { connectionId: selectedLLM, modelName: 'default' } : undefined,
        };

        try {
            await createProject(projectData, schemaFile, domainTemplate);
            toast.success('Project created successfully!');
            setIsCreateModalOpen(false);

            // Reset form
            setNewProjectName('');
            setNewProjectDesc('');
            setNewProjectType('PDF');
            setNewProjectMode('Field Extraction');
            setDomainTemplate('Custom');
            setSelectedLLM('');
            setContractFields(CONTRACT_FIELDS_PRESET.map(f => ({ ...f, enabled: true })));
            setSchemaFile(null);
            setSchemaFileError('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create project');
        }
    };

    const handleEditProjectClick = async (project: any) => {
        try {
            // Fetch fresh project data from API
            await getProject(project.id);

            // Use the fresh data from currentProject in store
            const { currentProject } = useProjectStore.getState();
            if (!currentProject) {
                toast.error('Failed to load project details');
                return;
            }

            setEditingProject({ ...currentProject });

            if (currentProject.schema && currentProject.schema.length > 0) {
                const mergedSchema = CONTRACT_FIELDS_PRESET.map(presetField => {
                    const existingField = currentProject.schema?.find((s: any) => s.key === presetField.key);
                    if (existingField) {
                        return { ...existingField, enabled: true };
                    } else {
                        return { ...presetField, enabled: false };
                    }
                });
                setEditingSchema(mergedSchema);
            } else {
                setEditingSchema([]);
            }
            setIsEditModalOpen(true);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load project details');
        }
    };

    const handleSaveEditedProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        const updatedSchema = editingSchema.filter(f => f.enabled).map(({ enabled, ...rest }) => rest);

        const updatedData = {
            name: editingProject.name,
            description: editingProject.description,
            schema: updatedSchema,
        };

        try {
            await updateProject(editingProject.id, updatedData, editSchemaFile);
            toast.success('Project updated successfully!');
            setIsEditModalOpen(false);
            setEditingProject(null);
            setEditSchemaFile(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update project');
        }
    };

    const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingProjectId(projectId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingProjectId) return;

        try {
            await deleteProject(deletingProjectId);
            toast.success('Project deleted successfully!');
            setIsDeleteModalOpen(false);
            setDeletingProjectId(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete project');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleContractField = (id: string) => {
        setContractFields(fields => fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    const updateContractFieldPrompt = (id: string, newPrompt: string) => {
        setContractFields(fields => fields.map(f => f.id === id ? { ...f, description: newPrompt } : f));
    };

    const toggleEditingField = (id: string) => {
        setEditingSchema(fields => fields.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    };

    const updateEditingFieldPrompt = (id: string, newPrompt: string) => {
        setEditingSchema(fields => fields.map(f => f.id === id ? { ...f, description: newPrompt } : f));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Prompt Studio</h2>
                    <p className="text-muted-foreground mt-1">Manage your extraction projects and prompts.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} disabled={isLoading}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Loading State */}
            {isLoading && projects.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading projects...</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && projects.length === 0 && (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first extraction project to get started</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Project
                    </Button>
                </div>
            )}

            {/* Projects Grid */}
            {!isLoading && filteredProjects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => handleEditProjectClick(project)}
                            className="group bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <Folder size={24} />
                                </div>
                                <button
                                    onClick={(e) => handleDeleteClick(project.id, e)}
                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                {project.description}
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                    {project.documentType}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                    {project.extractionMode}
                                </span>
                            </div>

                            <div className="flex items-center text-xs text-muted-foreground pt-4 border-t border-border">
                                <FileText size={14} className="mr-1" />
                                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!isLoading && filteredProjects.length === 0 && projects.length > 0 && (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground">Try adjusting your search query</p>
                </div>
            )}

            {/* Create Project Dialog */}
            <Dialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Project"
            >
                <form onSubmit={handleCreateProject} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            required
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g. Invoice Extraction"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            required
                            value={newProjectDesc}
                            onChange={(e) => setNewProjectDesc(e.target.value)}
                            placeholder="Brief description of the project"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Document Type</Label>
                            <Select
                                id="type"
                                value={newProjectType}
                                onChange={(e) => setNewProjectType(e.target.value as DocumentType)}
                            >
                                <option value="PDF">PDF</option>
                                <option value="Images">Images</option>
                                <option value="Scanned">Scanned</option>
                                <option value="Handwritten">Handwritten</option>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mode">Extraction Mode</Label>
                            <Select
                                id="mode"
                                value={newProjectMode}
                                onChange={(e) => setNewProjectMode(e.target.value as ExtractionMode)}
                            >
                                <option value="Field Extraction">Field Extraction</option>
                                <option value="Classification">Classification</option>
                                <option value="Summarization">Summarization</option>
                                <option value="Hybrid">Hybrid</option>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="template">Domain Template</Label>
                        <Select
                            id="template"
                            value={domainTemplate}
                            onChange={(e) => setDomainTemplate(e.target.value)}
                        >
                            <option value="Custom">Custom (Start from scratch)</option>
                            <option value="Invoice">Invoice</option>
                            <option value="Bill of Lading">Bill of Lading</option>
                            <option value="Contract">Contract Document</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <LLMSelector
                            value={selectedLLM}
                            onChange={setSelectedLLM}
                            label="Extraction Model"
                        />
                    </div>

                    {/* Schema File Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="schemaFile">Extraction Schema (Optional)</Label>
                        <div className="space-y-2">
                            <Input
                                id="schemaFile"
                                type="file"
                                accept=".json"
                                onChange={handleSchemaFileChange}
                                className="cursor-pointer"
                            />
                            {schemaFile && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <FileText size={16} />
                                    <span>{schemaFile.name} ({(schemaFile.size / 1024).toFixed(2)} KB)</span>
                                </div>
                            )}
                            {schemaFileError && (
                                <p className="text-sm text-destructive">{schemaFileError}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload a JSON file defining the extraction schema. If not provided, you can configure it later or use a template below.
                            </p>
                        </div>
                    </div>

                    {domainTemplate === 'Contract' && (
                        <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
                            <h4 className="font-semibold text-sm">Contract Extraction Schema</h4>
                            <p className="text-xs text-muted-foreground">Select fields to extract and customize their prompts.</p>
                            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                                {contractFields.map((field) => (
                                    <div key={field.id} className="flex items-start gap-3 p-2 bg-card border border-border rounded-md">
                                        <input
                                            type="checkbox"
                                            checked={field.enabled}
                                            onChange={() => toggleContractField(field.id)}
                                            className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">{field.key}</span>
                                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{field.type}</span>
                                            </div>
                                            <textarea
                                                value={field.description}
                                                onChange={(e) => updateContractFieldPrompt(field.id, e.target.value)}
                                                disabled={!field.enabled}
                                                className="w-full text-xs p-2 rounded border border-input bg-background min-h-[60px] focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </Button>
                    </div>
                </form>
            </Dialog>

            {/* Edit Project Dialog */}
            <Dialog
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Project"
            >
                {editingProject && (
                    <form onSubmit={handleSaveEditedProject} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Project Name</Label>
                            <Input
                                id="edit-name"
                                required
                                value={editingProject.name}
                                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                required
                                value={editingProject.description}
                                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                            />
                        </div>

                        {/* Schema File Upload for Edit */}
                        <div className="space-y-2">
                            <Label htmlFor="editSchemaFile">Update Extraction Schema (Optional)</Label>
                            <div className="space-y-2">
                                <Input
                                    id="editSchemaFile"
                                    type="file"
                                    accept=".json"
                                    onChange={handleEditSchemaFileChange}
                                    className="cursor-pointer"
                                />
                                {editSchemaFile && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <FileText size={16} />
                                        <span>{editSchemaFile.name} ({(editSchemaFile.size / 1024).toFixed(2)} KB)</span>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Upload a new JSON schema file to update the extraction configuration.
                                </p>
                            </div>
                        </div>

                        {editingSchema.length > 0 && (
                            <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/30">
                                <h4 className="font-semibold text-sm">Contract Extraction Schema</h4>
                                <p className="text-xs text-muted-foreground">Modify fields to extract and customize their prompts.</p>
                                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                                    {editingSchema.map((field) => (
                                        <div key={field.id} className="flex items-start gap-3 p-2 bg-card border border-border rounded-md">
                                            <input
                                                type="checkbox"
                                                checked={field.enabled}
                                                onChange={() => toggleEditingField(field.id)}
                                                className="mt-1.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium">{field.key}</span>
                                                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{field.type}</span>
                                                </div>
                                                <textarea
                                                    value={field.description}
                                                    onChange={(e) => updateEditingFieldPrompt(field.id, e.target.value)}
                                                    disabled={!field.enabled}
                                                    className="w-full text-xs p-2 rounded border border-input bg-background min-h-[60px] focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Project"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this project? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Project'
                            )}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default PromptStudio;
