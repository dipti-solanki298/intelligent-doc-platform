import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server for testing
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

describe('Mock API - Authentication', () => {
    it('should login successfully with valid credentials', async () => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123',
            }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('user');
        expect(data).toHaveProperty('token');
        expect(data.user.email).toBe('admin@example.com');
    });

    it('should reject login with invalid credentials', async () => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'wrong@example.com',
                password: 'wrongpassword',
            }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toHaveProperty('error');
    });
});

describe('Mock API - Projects', () => {
    let authToken: string;

    beforeAll(async () => {
        // Login to get token
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123',
            }),
        });
        const data = await response.json();
        authToken = data.token;
    });

    it('should get all projects with valid token', async () => {
        const response = await fetch('/api/projects', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
    });

    it('should reject request without token', async () => {
        const response = await fetch('/api/projects');
        expect(response.status).toBe(401);
    });

    it('should create a new project', async () => {
        const newProject = {
            name: 'Test Project',
            description: 'Test Description',
            documentType: 'PDF',
            extractionMode: 'Field Extraction',
            schema: [],
        };

        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(newProject),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.name).toBe('Test Project');
        expect(data).toHaveProperty('id');
    });
});
