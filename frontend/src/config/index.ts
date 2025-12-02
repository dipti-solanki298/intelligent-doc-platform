// Environment configuration
export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    appEnv: import.meta.env.VITE_APP_ENV || 'development',
    enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS !== 'false',
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
    supportedFileTypes: (import.meta.env.VITE_SUPPORTED_FILE_TYPES || '.pdf,.png,.jpg,.jpeg').split(','),
    useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true', // Global toggle (legacy)
    useMockAuth: import.meta.env.VITE_USE_MOCK_AUTH === 'true', // Mock auth APIs
    useMockProjects: import.meta.env.VITE_USE_MOCK_PROJECTS === 'true', // Mock project APIs
} as const;

export default config;
