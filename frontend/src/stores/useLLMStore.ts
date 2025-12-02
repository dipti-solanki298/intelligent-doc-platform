import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';
import { LLMConnection } from '@/types';

interface LLMStore {
    connections: LLMConnection[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchConnections: () => Promise<void>;
    createConnection: (connection: Omit<LLMConnection, 'id'>) => Promise<void>;
    updateConnection: (id: string, updates: Partial<LLMConnection>) => Promise<void>;
    deleteConnection: (id: string) => Promise<void>;
    testConnection: (id: string) => Promise<{ success: boolean; message: string }>;
    clearError: () => void;
}

export const useLLMStore = create<LLMStore>()(
    persist(
        (set, get) => ({
            connections: [],
            isLoading: false,
            error: null,

            fetchConnections: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.get('/llm-connections');
                    set({ connections: response.data, isLoading: false });
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Failed to fetch connections';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            createConnection: async (connectionData) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post('/llm-connections', connectionData);
                    const newConnection = response.data;
                    set(state => ({
                        connections: [...state.connections, newConnection],
                        isLoading: false
                    }));
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Failed to create connection';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            updateConnection: async (id: string, updates) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.patch(`/llm-connections/${id}`, updates);
                    const updatedConnection = response.data;
                    set(state => ({
                        connections: state.connections.map(c => c.id === id ? updatedConnection : c),
                        isLoading: false
                    }));
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Failed to update connection';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            deleteConnection: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.delete(`/llm-connections/${id}`);
                    set(state => ({
                        connections: state.connections.filter(c => c.id !== id),
                        isLoading: false
                    }));
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Failed to delete connection';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            testConnection: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post(`/llm-connections/${id}/test`);
                    set({ isLoading: false });
                    return response.data;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || 'Connection test failed';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'llm-storage',
        }
    )
);
