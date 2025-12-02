import React, { useState, useEffect } from 'react';
import { Save, Server, Cloud, FileText, Globe, Key, Plus, Trash2, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Input, Label, Select } from '@/components/ui';
import { LLMProvider } from '@/types';
import { useLLMStore } from '@/stores/useLLMStore';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

const Settings = () => {
    const { connections, fetchConnections, createConnection, updateConnection, deleteConnection, testConnection, isLoading: llmLoading, error, clearError } = useLLMStore();

    const [activeTab, setActiveTab] = useState('connections');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

    // LLM Connection State
    const [newConnName, setNewConnName] = useState('');
    const [newConnProvider, setNewConnProvider] = useState<LLMProvider>('OpenAI');
    const [newConnKey, setNewConnKey] = useState('');
    const [newConnBaseUrl, setNewConnBaseUrl] = useState('');
    const [newConnModel, setNewConnModel] = useState('');

    // Integrations State
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [integrationsLoading, setIntegrationsLoading] = useState(false);
    const [testingIntegrationId, setTestingIntegrationId] = useState<string | null>(null);

    // Document Spec State
    const [documentSpecs, setDocumentSpecs] = useState<any[]>([]);
    const [specsLoading, setSpecsLoading] = useState(false);
    const [specName, setSpecName] = useState('');
    const [specCategory, setSpecCategory] = useState('Financial');
    const [specRetention, setSpecRetention] = useState('365');
    const [specCompliance, setSpecCompliance] = useState('GDPR');
    const [specDescription, setSpecDescription] = useState('');

    // Fetch connections on mount
    useEffect(() => {
        fetchConnections().catch(() => {
            toast.error('Failed to load LLM connections');
        });
    }, [fetchConnections]);

    // Fetch integrations when tab is active
    useEffect(() => {
        if (activeTab === 'integrations') {
            fetchIntegrations();
        }
    }, [activeTab]);

    // Fetch document specs when tab is active
    useEffect(() => {
        if (activeTab === 'doc-spec') {
            fetchDocumentSpecs();
        }
    }, [activeTab]);

    // Clear errors when they appear
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    // Integrations API calls
    const fetchIntegrations = async () => {
        setIntegrationsLoading(true);
        try {
            const response = await apiClient.get('/integrations');
            setIntegrations(response.data);
        } catch (error: any) {
            toast.error('Failed to load integrations');
        } finally {
            setIntegrationsLoading(false);
        }
    };

    const toggleIntegration = async (id: string, enabled: boolean) => {
        try {
            await apiClient.patch(`/integrations/${id}`, { enabled: !enabled });
            await fetchIntegrations();
            toast.success(enabled ? 'Integration disabled' : 'Integration enabled');
        } catch (error: any) {
            toast.error('Failed to update integration');
        }
    };

    const testIntegration = async (id: string) => {
        setTestingIntegrationId(id);
        try {
            const response = await apiClient.post(`/integrations/${id}/test`);
            if (response.data.success) {
                toast.success(response.data.message);
            }
        } catch (error: any) {
            toast.error('Integration test failed');
        } finally {
            setTestingIntegrationId(null);
        }
    };

    // Document Specs API calls
    const fetchDocumentSpecs = async () => {
        setSpecsLoading(true);
        try {
            const response = await apiClient.get('/document-specs');
            setDocumentSpecs(response.data);
        } catch (error: any) {
            toast.error('Failed to load document specifications');
        } finally {
            setSpecsLoading(false);
        }
    };

    const handleSaveDocumentSpec = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/document-specs', {
                name: specName,
                category: specCategory,
                retentionDays: parseInt(specRetention),
                complianceStandard: specCompliance,
                description: specDescription,
            });
            toast.success('Document specification saved successfully!');
            await fetchDocumentSpecs();
            // Reset form
            setSpecName('');
            setSpecCategory('Financial');
            setSpecRetention('365');
            setSpecCompliance('GDPR');
            setSpecDescription('');
        } catch (error: any) {
            toast.error('Failed to save document specification');
        }
    };

    const deleteDocumentSpec = async (id: string) => {
        try {
            await apiClient.delete(`/document-specs/${id}`);
            toast.success('Document specification deleted');
            await fetchDocumentSpecs();
        } catch (error: any) {
            toast.error('Failed to delete specification');
        }
    };

    // LLM Connection handlers
    const handleAddConnection = async (e: React.FormEvent) => {
        e.preventDefault();

        const connectionData = {
            name: newConnName,
            provider: newConnProvider,
            apiKey: newConnKey,
            baseUrl: newConnBaseUrl || undefined,
            modelName: newConnModel,
            isDefault: connections.length === 0
        };

        try {
            await createConnection(connectionData);
            toast.success('Connection added successfully!');
            setIsAddModalOpen(false);

            // Reset form
            setNewConnName('');
            setNewConnProvider('OpenAI');
            setNewConnKey('');
            setNewConnBaseUrl('');
            setNewConnModel('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to add connection');
        }
    };

    const handleDeleteConnection = async (id: string) => {
        try {
            await deleteConnection(id);
            toast.success('Connection deleted successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete connection');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const updates = connections.map(async (conn) => {
                if (conn.id === id && !conn.isDefault) {
                    await updateConnection(conn.id, { isDefault: true });
                } else if (conn.id !== id && conn.isDefault) {
                    await updateConnection(conn.id, { isDefault: false });
                }
            });

            await Promise.all(updates);
            toast.success('Default connection updated!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update default connection');
        }
    };

    const handleTestConnection = async (id: string) => {
        setTestingConnectionId(id);
        try {
            const result = await testConnection(id);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error('Connection test failed');
            }
        } catch (error: any) {
            toast.error(error.message || 'Connection test failed');
        } finally {
            setTestingConnectionId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1">Manage platform configurations and integrations.</p>
            </div>

            <div className="flex gap-4 border-b border-border">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'connections'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('connections')}
                >
                    LLM Connections
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'integrations'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('integrations')}
                >
                    Integrations
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'doc-spec'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    onClick={() => setActiveTab('doc-spec')}
                >
                    Document Specifications
                </button>
            </div>

            {/* LLM Connections Tab */}
            {activeTab === 'connections' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">LLM Providers</h3>
                            <p className="text-sm text-muted-foreground">Manage your connections to LLM providers (OpenAI, Gemini, Claude, etc.)</p>
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} disabled={llmLoading}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Connection
                        </Button>
                    </div>

                    {llmLoading && connections.length === 0 && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Loading connections...</span>
                        </div>
                    )}

                    {!llmLoading && connections.length === 0 && (
                        <div className="text-center py-12 bg-card border border-border rounded-xl">
                            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No LLM connections yet</h3>
                            <p className="text-muted-foreground mb-4">Add your first LLM provider connection to get started</p>
                            <Button onClick={() => setIsAddModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Connection
                            </Button>
                        </div>
                    )}

                    {!llmLoading && connections.length > 0 && (
                        <div className="grid gap-4">
                            {connections.map((conn) => (
                                <div key={conn.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Key size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{conn.name}</h4>
                                                {conn.isDefault && (
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Default</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {conn.provider} • {conn.modelName || 'Default Model'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestConnection(conn.id)}
                                            disabled={testingConnectionId === conn.id}
                                        >
                                            {testingConnectionId === conn.id ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Testing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Test
                                                </>
                                            )}
                                        </Button>
                                        {!conn.isDefault && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleSetDefault(conn.id)}
                                                disabled={llmLoading}
                                            >
                                                Make Default
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteConnection(conn.id)}
                                            disabled={llmLoading}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Connection Modal */}
                    {isAddModalOpen && (
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                                <h3 className="text-lg font-semibold">Add New Connection</h3>
                                <form onSubmit={handleAddConnection} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Connection Name</Label>
                                        <Input
                                            placeholder="e.g. My Gemini Pro"
                                            value={newConnName}
                                            onChange={(e) => setNewConnName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Provider</Label>
                                        <Select
                                            value={newConnProvider}
                                            onChange={(e) => setNewConnProvider(e.target.value as LLMProvider)}
                                        >
                                            <option value="OpenAI">OpenAI</option>
                                            <option value="Gemini">Google Gemini</option>
                                            <option value="Claude">Anthropic Claude</option>
                                            <option value="Custom">Custom / Local LLM</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <Input
                                            type="password"
                                            placeholder="sk-..."
                                            value={newConnKey}
                                            onChange={(e) => setNewConnKey(e.target.value)}
                                            required={newConnProvider !== 'Custom'}
                                        />
                                    </div>
                                    {newConnProvider === 'Custom' && (
                                        <div className="space-y-2">
                                            <Label>Base URL</Label>
                                            <Input
                                                placeholder="http://localhost:11434/v1"
                                                value={newConnBaseUrl}
                                                onChange={(e) => setNewConnBaseUrl(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Default Model Name</Label>
                                        <Input
                                            placeholder="e.g. gpt-4, gemini-pro"
                                            value={newConnModel}
                                            onChange={(e) => setNewConnModel(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddModalOpen(false)}
                                            disabled={llmLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={llmLoading}>
                                            {llmLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Connection'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <div className="grid gap-6">
                    {integrationsLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Loading integrations...</span>
                        </div>
                    )}

                    {!integrationsLoading && integrations.map((integration) => (
                        <div key={integration.id} className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${integration.type === 'sharepoint' ? 'bg-blue-100 text-blue-600' :
                                            integration.type === 's3' ? 'bg-orange-100 text-orange-600' :
                                                integration.type === 'gdrive' ? 'bg-green-100 text-green-600' :
                                                    'bg-purple-100 text-purple-600'
                                        }`}>
                                        {integration.type === 'sharepoint' && <Server size={20} />}
                                        {integration.type === 's3' && <Cloud size={20} />}
                                        {integration.type === 'gdrive' && <Globe size={20} />}
                                        {integration.type === 'agent' && <FileText size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{integration.name}</h3>
                                        {integration.lastSync && (
                                            <p className="text-xs text-muted-foreground">
                                                Last synced: {new Date(integration.lastSync).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleIntegration(integration.id, integration.enabled)}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        {integration.enabled ? (
                                            <ToggleRight className="h-6 w-6 text-primary" />
                                        ) : (
                                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                                        )}
                                        <span className={integration.enabled ? 'text-primary font-medium' : 'text-muted-foreground'}>
                                            {integration.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => testIntegration(integration.id)}
                                    disabled={testingIntegrationId === integration.id || !integration.enabled}
                                >
                                    {testingIntegrationId === integration.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing...
                                        </>
                                    ) : (
                                        'Test Connection'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Document Specifications Tab */}
            {activeTab === 'doc-spec' && (
                <div className="space-y-6">
                    {/* Create New Spec Form */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Create New Specification</h3>
                        <form onSubmit={handleSaveDocumentSpec} className="space-y-4 max-w-2xl">
                            <div className="space-y-2">
                                <Label>Specification Name</Label>
                                <Input
                                    placeholder="e.g. Enterprise Invoice Spec v1"
                                    value={specName}
                                    onChange={(e) => setSpecName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Document Category</Label>
                                    <Select value={specCategory} onChange={(e) => setSpecCategory(e.target.value)}>
                                        <option>Financial</option>
                                        <option>Legal</option>
                                        <option>Medical</option>
                                        <option>Logistics</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Retention Policy (Days)</Label>
                                    <Input
                                        type="number"
                                        placeholder="365"
                                        value={specRetention}
                                        onChange={(e) => setSpecRetention(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Compliance Standard</Label>
                                <Select value={specCompliance} onChange={(e) => setSpecCompliance(e.target.value)}>
                                    <option>GDPR</option>
                                    <option>HIPAA</option>
                                    <option>SOC2</option>
                                    <option>None</option>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Input
                                    placeholder="Brief description of this specification"
                                    value={specDescription}
                                    onChange={(e) => setSpecDescription(e.target.value)}
                                />
                            </div>
                            <div className="pt-4">
                                <Button type="submit" disabled={specsLoading}>
                                    {specsLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Specification
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Existing Specs List */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Existing Specifications</h3>
                        {specsLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2 text-muted-foreground">Loading specifications...</span>
                            </div>
                        )}

                        {!specsLoading && documentSpecs.length === 0 && (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No specifications yet</h3>
                                <p className="text-muted-foreground">Create your first document specification above</p>
                            </div>
                        )}

                        {!specsLoading && documentSpecs.length > 0 && (
                            <div className="grid gap-4">
                                {documentSpecs.map((spec) => (
                                    <div key={spec.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                                        <div>
                                            <h4 className="font-semibold">{spec.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {spec.category} • {spec.retentionDays} days retention • {spec.complianceStandard}
                                            </p>
                                            {spec.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{spec.description}</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteDocumentSpec(spec.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
