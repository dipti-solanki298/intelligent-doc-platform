// Backend type definitions matching FastAPI schemas

export interface BackendFieldSchema {
    type: string;
    prompt: string;
    enabled: boolean;
}

export interface BackendProject {
    id: string;
    project_name: string;
    description: string;
    document_type: string;
    extraction_mode: string;
    domain_template: string;
    extraction_model: string[];
    extraction_schema: Record<string, BackendFieldSchema> | null;
    created_at: string;
    updated_at: string;
}

export interface BackendProjectCreate {
    project_name: string;
    description: string;
    document_type: string;
    extraction_mode: string;
    domain_template: string;
    extraction_model: string[];
    extraction_schema_file?: File;
}
