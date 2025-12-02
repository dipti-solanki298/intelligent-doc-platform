// Mock data for projects
export const mockProjects = [
    {
        id: '1',
        name: 'Contract Analysis',
        description: 'Extract key terms and conditions from legal contracts',
        documentType: 'PDF',
        extractionMode: 'Field Extraction',
        schema: [
            { id: '1', key: 'contract_title', description: 'Extract the full legal title of the contract', type: 'string', required: true },
            { id: '2', key: 'parties', description: 'Extract all parties involved in the contract', type: 'array', required: true },
            { id: '3', key: 'effective_date', description: 'Extract the effective date of the contract', type: 'date', required: true },
            { id: '4', key: 'termination_date', description: 'Extract the termination or expiration date', type: 'date', required: false },
            { id: '5', key: 'payment_terms', description: 'Extract payment terms and conditions', type: 'string', required: true },
        ],
        llmConfig: {
            connectionId: '1',
            modelName: 'gpt-4-turbo',
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
    },
    {
        id: '2',
        name: 'Invoice Processing',
        description: 'Extract invoice details for accounting automation',
        documentType: 'PDF',
        extractionMode: 'Hybrid',
        schema: [
            { id: '1', key: 'invoice_number', description: 'Extract invoice number', type: 'string', required: true },
            { id: '2', key: 'invoice_date', description: 'Extract invoice date', type: 'date', required: true },
            { id: '3', key: 'vendor_name', description: 'Extract vendor/supplier name', type: 'string', required: true },
            { id: '4', key: 'total_amount', description: 'Extract total amount', type: 'number', required: true },
            { id: '5', key: 'line_items', description: 'Extract all line items', type: 'array', required: true },
        ],
        llmConfig: {
            connectionId: '2',
            modelName: 'gemini-1.5-pro',
        },
        createdAt: '2024-02-01T09:15:00Z',
        updatedAt: '2024-02-10T11:20:00Z',
    },
    {
        id: '3',
        name: 'Medical Records',
        description: 'Classify medical reports and extract patient vitals',
        documentType: 'Scanned',
        extractionMode: 'Hybrid',
        schema: [
            { id: '1', key: 'patient_name', description: 'Extract patient full name', type: 'string', required: true },
            { id: '2', key: 'patient_id', description: 'Extract patient ID or MRN', type: 'string', required: true },
            { id: '3', key: 'diagnosis', description: 'Extract primary diagnosis', type: 'string', required: true },
            { id: '4', key: 'medications', description: 'Extract prescribed medications', type: 'array', required: false },
        ],
        llmConfig: {
            connectionId: '1',
            modelName: 'gpt-4-turbo',
        },
        createdAt: '2023-11-01T09:15:00Z',
        updatedAt: '2023-11-05T11:20:00Z',
    },
];

// Mock data for LLM connections
export const mockLLMConnections = [
    {
        id: '1',
        name: 'My OpenAI',
        provider: 'OpenAI',
        apiKey: 'sk-...hidden...',
        modelName: 'gpt-4-turbo',
        isDefault: true,
    },
    {
        id: '2',
        name: 'Corporate Gemini',
        provider: 'Gemini',
        apiKey: 'AI...hidden...',
        modelName: 'gemini-1.5-pro',
        isDefault: false,
    },
    {
        id: '3',
        name: 'Claude Anthropic',
        provider: 'Claude',
        apiKey: 'sk-ant-...hidden...',
        modelName: 'claude-3-opus',
        isDefault: false,
    },
];

// Mock data for users
export const mockUsers = [
    {
        id: '1',
        email: 'admin@example.com',
        password: 'admin123', // In real app, this would be hashed
        name: 'John Doe',
        role: 'admin',
        avatar: null,
    },
    {
        id: '2',
        email: 'user@example.com',
        password: 'user123',
        name: 'Jane Smith',
        role: 'user',
        avatar: null,
    },
];

// Mock data for documents
export const mockDocuments = [
    {
        id: '1',
        name: 'contract_sample.pdf',
        url: '/sample.pdf',
        size: 1024567,
        type: 'application/pdf',
        uploadedAt: '2024-03-01T10:00:00Z',
        projectId: '1',
    },
];

// Mock data for extraction results
export const mockExtractionResults = {
    '1': {
        documentId: '1',
        projectId: '1',
        status: 'completed',
        results: {
            contract_title: 'Software License Agreement',
            parties: ['Acme Corp', 'TechStart Inc'],
            effective_date: '2024-01-01',
            termination_date: '2025-12-31',
            payment_terms: 'Net 30 days from invoice date',
        },
        confidence: 0.95,
        extractedAt: '2024-03-01T10:05:00Z',
    },
};

// Mock data for pipelines
export const mockPipelines = [
    {
        id: '1',
        name: 'Invoice Processing Pipeline',
        description: 'End-to-end invoice processing workflow',
        nodes: [],
        edges: [],
        createdAt: '2024-02-15T14:30:00Z',
        updatedAt: '2024-02-20T16:45:00Z',
    },
];

// Mock data for integrations
export const mockIntegrations = [
    {
        id: '1',
        type: 'sharepoint',
        name: 'SharePoint Integration',
        enabled: true,
        config: {
            clientId: 'sp-client-123',
            tenantId: 'tenant-456',
            siteUrl: 'https://company.sharepoint.com/sites/docs',
        },
        lastSync: '2024-03-15T10:30:00Z',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-03-15T10:30:00Z',
    },
    {
        id: '2',
        type: 's3',
        name: 'AWS S3 Storage',
        enabled: false,
        config: {
            accessKeyId: 'AKIA...hidden...',
            region: 'us-east-1',
            bucketName: 'doc-platform-storage',
        },
        lastSync: null,
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-01T09:00:00Z',
    },
];

// Mock data for document specifications
export const mockDocumentSpecs = [
    {
        id: '1',
        name: 'Enterprise Invoice Spec v1',
        category: 'Financial',
        retentionDays: 2555,
        complianceStandard: 'SOC2',
        description: 'Standard specification for enterprise invoice processing',
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-02-20T14:30:00Z',
    },
    {
        id: '2',
        name: 'Medical Records HIPAA',
        category: 'Medical',
        retentionDays: 3650,
        complianceStandard: 'HIPAA',
        description: 'HIPAA-compliant medical records specification',
        createdAt: '2024-01-15T11:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
    },
];

