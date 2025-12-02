import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client';
import { Project } from '@/types';
import {
    mapBackendProjectToFrontend,
    mapFrontendProjectToBackendFormData,
    mapFrontendProjectUpdateToBackendFormData,
} from '@/lib/api-adapters/project-adapter';
import { config } from '@/config';

interface ProjectStore {
    projects: Project[];
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProjects: () => Promise<void>;
    getProject: (id: string) => Promise<void>;
    createProject: (
        project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
        schemaFile?: File | null,
        domainTemplate?: string
    ) => Promise<void>;
    updateProject: (
        id: string,
        updates: Partial<Project>,
        schemaFile?: File | null
    ) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setCurrentProject: (project: Project | null) => void;
    clearError: () => void;
}

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            projects: [],
            currentProject: null,
            isLoading: false,
            error: null,

            fetchProjects: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.get('/projects/projects');

                    // Map backend projects to frontend format if not using mock API
                    const projects = config.useMockProjects
                        ? response.data
                        : response.data.map(mapBackendProjectToFrontend);

                    set({ projects, isLoading: false });
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to fetch projects';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            getProject: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.get(`/projects/projects/${id}`);

                    // Map backend project to frontend format if not using mock API
                    const project = config.useMockProjects
                        ? response.data
                        : mapBackendProjectToFrontend(response.data);

                    set({ currentProject: project, isLoading: false });
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to fetch project';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            createProject: async (projectData, schemaFile, domainTemplate = 'Custom') => {
                set({ isLoading: true, error: null });
                try {
                    let response;

                    if (config.useMockProjects) {
                        // Use JSON for mock API
                        response = await apiClient.post('/projects/projects', projectData);
                    } else {
                        // Use FormData for real backend
                        const formData = mapFrontendProjectToBackendFormData(
                            projectData,
                            schemaFile,
                            domainTemplate
                        );
                        response = await apiClient.post('/projects/projects', formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        });
                    }

                    // Map backend project to frontend format if not using mock API
                    const newProject = config.useMockProjects
                        ? response.data
                        : mapBackendProjectToFrontend(response.data);

                    set(state => ({
                        projects: [...state.projects, newProject],
                        isLoading: false
                    }));
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to create project';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            updateProject: async (id: string, updates, schemaFile) => {
                set({ isLoading: true, error: null });
                try {
                    let response;

                    if (config.useMockProjects) {
                        // Use PATCH with JSON for mock API
                        response = await apiClient.patch(`/projects/projects/${id}`, updates);
                    } else {
                        // Use PUT with FormData for real backend
                        const formData = mapFrontendProjectUpdateToBackendFormData(updates, schemaFile);
                        response = await apiClient.put(`/projects/projects/${id}`, formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        });
                    }

                    // Map backend project to frontend format if not using mock API
                    const updatedProject = config.useMockProjects
                        ? response.data
                        : mapBackendProjectToFrontend(response.data);

                    set(state => ({
                        projects: state.projects.map(p => p.id === id ? updatedProject : p),
                        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
                        isLoading: false
                    }));
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to update project';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            deleteProject: async (id: string) => {
                set({ isLoading: true, error: null });
                try {
                    await apiClient.delete(`/projects/projects/${id}`);
                    set(state => ({
                        projects: state.projects.filter(p => p.id !== id),
                        currentProject: state.currentProject?.id === id ? null : state.currentProject,
                        isLoading: false
                    }));
                } catch (error: any) {
                    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to delete project';
                    set({ error: errorMessage, isLoading: false });
                    throw new Error(errorMessage);
                }
            },

            setCurrentProject: (project) => {
                set({ currentProject: project });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'project-storage',
            partialize: (state) => ({
                currentProject: state.currentProject
            }),
        }
    )
);
