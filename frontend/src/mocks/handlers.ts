import { http, HttpResponse, delay } from 'msw';
import { mockProjects, mockLLMConnections, mockUsers, mockDocuments, mockExtractionResults, mockIntegrations, mockDocumentSpecs } from './data';

// Simulate network delay
const NETWORK_DELAY = 500; // ms

// In-memory storage (resets on page reload)
let projects = [...mockProjects];
let llmConnections = [...mockLLMConnections];
let documents = [...mockDocuments];
let extractionResults = { ...mockExtractionResults };
let integrations = [...mockIntegrations];
let documentSpecs = [...mockDocumentSpecs];

// Auth token storage
let currentToken: string | null = null;
let currentUser: typeof mockUsers[0] | null = null;

export const handlers = [
    // ==================== AUTH ENDPOINTS ====================

    // Login
    http.post('/api/auth/login', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const body = await request.json() as { email: string; password: string };
        const user = mockUsers.find(
            (u) => u.email === body.email && u.password === body.password
        );

        if (!user) {
            return HttpResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = `mock-token-${Date.now()}`;
        currentToken = token;
        currentUser = user;

        const { password, ...userWithoutPassword } = user;
        return HttpResponse.json({
            user: userWithoutPassword,
            token,
        });
    }),

    // Get current user
    http.get('/api/auth/me', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken || authHeader !== `Bearer ${currentToken}`) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!currentUser) {
            return HttpResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const { password, ...userWithoutPassword } = currentUser;
        return HttpResponse.json(userWithoutPassword);
    }),

    // Logout
    http.post('/api/auth/logout', async () => {
        await delay(NETWORK_DELAY);
        currentToken = null;
        currentUser = null;
        return HttpResponse.json({ message: 'Logged out successfully' });
    }),

    // ==================== PROJECT ENDPOINTS ====================

    // Get all projects
    http.get('/api/projects', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return HttpResponse.json(projects);
    }),

    // Get project by ID
    http.get('/api/projects/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const project = projects.find((p) => p.id === params.id);
        if (!project) {
            return HttpResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(project);
    }),

    // Create project
    http.post('/api/projects', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as Omit<typeof projects[0], 'id' | 'createdAt' | 'updatedAt'>;
        const newProject = {
            ...body,
            id: String(Date.now()),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        projects.push(newProject);
        return HttpResponse.json(newProject, { status: 201 });
    }),

    // Update project
    http.patch('/api/projects/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const projectIndex = projects.findIndex((p) => p.id === params.id);
        if (projectIndex === -1) {
            return HttpResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const updates = await request.json() as Partial<typeof projects[0]>;
        projects[projectIndex] = {
            ...projects[projectIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        return HttpResponse.json(projects[projectIndex]);
    }),

    // Delete project
    http.delete('/api/projects/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const projectIndex = projects.findIndex((p) => p.id === params.id);
        if (projectIndex === -1) {
            return HttpResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        projects.splice(projectIndex, 1);
        return HttpResponse.json({ message: 'Project deleted successfully' });
    }),

    // ==================== LLM CONNECTION ENDPOINTS ====================

    // Get all LLM connections
    http.get('/api/llm-connections', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return HttpResponse.json(llmConnections);
    }),

    // Create LLM connection
    http.post('/api/llm-connections', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as Omit<typeof llmConnections[0], 'id'>;
        const newConnection = {
            ...body,
            id: String(Date.now()),
        };

        llmConnections.push(newConnection);
        return HttpResponse.json(newConnection, { status: 201 });
    }),

    // Update LLM connection
    http.patch('/api/llm-connections/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const connectionIndex = llmConnections.findIndex((c) => c.id === params.id);
        if (connectionIndex === -1) {
            return HttpResponse.json(
                { error: 'Connection not found' },
                { status: 404 }
            );
        }

        const updates = await request.json() as Partial<typeof llmConnections[0]>;
        llmConnections[connectionIndex] = {
            ...llmConnections[connectionIndex],
            ...updates,
        };

        return HttpResponse.json(llmConnections[connectionIndex]);
    }),

    // Delete LLM connection
    http.delete('/api/llm-connections/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const connectionIndex = llmConnections.findIndex((c) => c.id === params.id);
        if (connectionIndex === -1) {
            return HttpResponse.json(
                { error: 'Connection not found' },
                { status: 404 }
            );
        }

        llmConnections.splice(connectionIndex, 1);
        return HttpResponse.json({ message: 'Connection deleted successfully' });
    }),

    // Test LLM connection
    http.post('/api/llm-connections/:id/test', async ({ params, request }) => {
        await delay(1000); // Longer delay to simulate API call

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const connection = llmConnections.find((c) => c.id === params.id);
        if (!connection) {
            return HttpResponse.json(
                { error: 'Connection not found' },
                { status: 404 }
            );
        }

        // Simulate success
        return HttpResponse.json({
            success: true,
            message: `Successfully connected to ${connection.provider}`,
            model: connection.modelName,
        });
    }),

    // ==================== DOCUMENT ENDPOINTS ====================

    // Upload document
    http.post('/api/documents/upload', async ({ request }) => {
        await delay(1500); // Longer delay to simulate file upload

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // In a real implementation, you'd handle FormData here
        const newDocument = {
            id: String(Date.now()),
            name: 'uploaded_document.pdf',
            url: '/sample.pdf', // Mock URL
            size: Math.floor(Math.random() * 5000000),
            type: 'application/pdf',
            uploadedAt: new Date().toISOString(),
            projectId: null,
        };

        documents.push(newDocument);
        return HttpResponse.json(newDocument, { status: 201 });
    }),

    // Get document
    http.get('/api/documents/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const document = documents.find((d) => d.id === params.id);
        if (!document) {
            return HttpResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(document);
    }),

    // Delete document
    http.delete('/api/documents/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const documentIndex = documents.findIndex((d) => d.id === params.id);
        if (documentIndex === -1) {
            return HttpResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        documents.splice(documentIndex, 1);
        return HttpResponse.json({ message: 'Document deleted successfully' });
    }),

    // Extract data from document
    http.post('/api/documents/:id/extract', async ({ params, request }) => {
        await delay(2000); // Longer delay to simulate extraction

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as { projectId: string };
        const document = documents.find((d) => d.id === params.id);

        if (!document) {
            return HttpResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        const project = projects.find((p) => p.id === body.projectId);
        if (!project) {
            return HttpResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Generate mock extraction results based on project schema
        const results: Record<string, any> = {};
        project.schema?.forEach((field) => {
            switch (field.type) {
                case 'string':
                    results[field.key] = `Mock ${field.key} value`;
                    break;
                case 'number':
                    results[field.key] = Math.floor(Math.random() * 10000);
                    break;
                case 'date':
                    results[field.key] = new Date().toISOString().split('T')[0];
                    break;
                case 'array':
                    results[field.key] = ['Item 1', 'Item 2', 'Item 3'];
                    break;
                default:
                    results[field.key] = null;
            }
        });

        const extractionResult = {
            documentId: params.id,
            projectId: body.projectId,
            status: 'completed',
            results,
            confidence: 0.85 + Math.random() * 0.15, // Random confidence between 0.85 and 1.0
            extractedAt: new Date().toISOString(),
        };

        return HttpResponse.json(extractionResult);
    }),

    // Get extraction results
    http.get('/api/documents/:id/results', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = extractionResults[params.id as keyof typeof extractionResults];
        if (!result) {
            return HttpResponse.json(
                { error: 'Results not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(result);
    }),

    // ==================== SETTINGS ENDPOINTS ====================

    // Get user settings
    http.get('/api/settings', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return HttpResponse.json({
            theme: 'light',
            notifications: true,
            language: 'en',
        });
    }),

    // Update settings
    http.patch('/api/settings', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const updates = await request.json();
        return HttpResponse.json({
            ...updates,
            message: 'Settings updated successfully',
        });
    }),

    // ==================== INTEGRATIONS ENDPOINTS ====================

    // Get all integrations
    http.get('/api/integrations', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return HttpResponse.json(integrations);
    }),

    // Get integration by ID
    http.get('/api/integrations/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const integration = integrations.find((i) => i.id === params.id);
        if (!integration) {
            return HttpResponse.json(
                { error: 'Integration not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(integration);
    }),

    // Create integration
    http.post('/api/integrations', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as Omit<typeof integrations[0], 'id' | 'createdAt' | 'updatedAt' | 'lastSync'>;
        const newIntegration = {
            ...body,
            id: String(Date.now()),
            lastSync: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        integrations.push(newIntegration);
        return HttpResponse.json(newIntegration, { status: 201 });
    }),

    // Update integration
    http.patch('/api/integrations/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const integrationIndex = integrations.findIndex((i) => i.id === params.id);
        if (integrationIndex === -1) {
            return HttpResponse.json(
                { error: 'Integration not found' },
                { status: 404 }
            );
        }

        const updates = await request.json() as Partial<typeof integrations[0]>;
        integrations[integrationIndex] = {
            ...integrations[integrationIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        return HttpResponse.json(integrations[integrationIndex]);
    }),

    // Delete integration
    http.delete('/api/integrations/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const integrationIndex = integrations.findIndex((i) => i.id === params.id);
        if (integrationIndex === -1) {
            return HttpResponse.json(
                { error: 'Integration not found' },
                { status: 404 }
            );
        }

        integrations.splice(integrationIndex, 1);
        return HttpResponse.json({ message: 'Integration deleted successfully' });
    }),

    // Test integration
    http.post('/api/integrations/:id/test', async ({ params, request }) => {
        await delay(1000); // Longer delay to simulate connection test

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const integration = integrations.find((i) => i.id === params.id);
        if (!integration) {
            return HttpResponse.json(
                { error: 'Integration not found' },
                { status: 404 }
            );
        }

        // Simulate success
        return HttpResponse.json({
            success: true,
            message: `Successfully connected to ${integration.name}`,
            type: integration.type,
        });
    }),

    // ==================== DOCUMENT SPECS ENDPOINTS ====================

    // Get all document specs
    http.get('/api/document-specs', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return HttpResponse.json(documentSpecs);
    }),

    // Get document spec by ID
    http.get('/api/document-specs/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const spec = documentSpecs.find((s) => s.id === params.id);
        if (!spec) {
            return HttpResponse.json(
                { error: 'Document spec not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(spec);
    }),

    // Create document spec
    http.post('/api/document-specs', async ({ request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json() as Omit<typeof documentSpecs[0], 'id' | 'createdAt' | 'updatedAt'>;
        const newSpec = {
            ...body,
            id: String(Date.now()),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        documentSpecs.push(newSpec);
        return HttpResponse.json(newSpec, { status: 201 });
    }),

    // Update document spec
    http.patch('/api/document-specs/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const specIndex = documentSpecs.findIndex((s) => s.id === params.id);
        if (specIndex === -1) {
            return HttpResponse.json(
                { error: 'Document spec not found' },
                { status: 404 }
            );
        }

        const updates = await request.json() as Partial<typeof documentSpecs[0]>;
        documentSpecs[specIndex] = {
            ...documentSpecs[specIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        return HttpResponse.json(documentSpecs[specIndex]);
    }),

    // Delete document spec
    http.delete('/api/document-specs/:id', async ({ params, request }) => {
        await delay(NETWORK_DELAY);

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !currentToken) {
            return HttpResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const specIndex = documentSpecs.findIndex((s) => s.id === params.id);
        if (specIndex === -1) {
            return HttpResponse.json(
                { error: 'Document spec not found' },
                { status: 404 }
            );
        }

        documentSpecs.splice(specIndex, 1);
        return HttpResponse.json({ message: 'Document spec deleted successfully' });
    }),
];
