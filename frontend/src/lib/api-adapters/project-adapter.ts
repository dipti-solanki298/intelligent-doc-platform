import { Project, ExtractionSchemaItem } from '@/types';
import { BackendProject, BackendFieldSchema } from '@/types/backend';

/**
 * Convert backend schema object to frontend schema array
 */
export function mapBackendSchemaToFrontend(
    backendSchema: Record<string, BackendFieldSchema> | null
): ExtractionSchemaItem[] {
    if (!backendSchema) return [];

    return Object.entries(backendSchema).map(([key, value], index) => ({
        id: String(index + 1),
        key: key,
        description: value.prompt,
        type: value.type as 'string' | 'number' | 'date' | 'array' | 'object',
        required: value.enabled,
    }));
}

/**
 * Convert frontend schema array to backend schema object
 */
export function mapFrontendSchemaToBackend(
    frontendSchema: ExtractionSchemaItem[]
): Record<string, BackendFieldSchema> {
    const backendSchema: Record<string, BackendFieldSchema> = {};

    frontendSchema.forEach((field) => {
        backendSchema[field.key] = {
            type: field.type,
            prompt: field.description,
            enabled: field.required,
        };
    });

    return backendSchema;
}

/**
 * Convert backend project to frontend project format
 */
export function mapBackendProjectToFrontend(backendProject: BackendProject): Project {
    return {
        id: backendProject.id,
        name: backendProject.project_name,
        description: backendProject.description || '',
        documentType: backendProject.document_type as any,
        extractionMode: backendProject.extraction_mode as any,
        schema: mapBackendSchemaToFrontend(backendProject.extraction_schema),
        llmConfig: {
            connectionId: backendProject.extraction_model[0] || '',
            modelName: backendProject.extraction_model[0] || '',
        },
        createdAt: backendProject.created_at,
        updatedAt: backendProject.updated_at,
    };
}

/**
 * Convert frontend project data to backend FormData format
 */
export function mapFrontendProjectToBackendFormData(
    frontendProject: Partial<Project>,
    schemaFile?: File | null,
    domainTemplate: string = 'Custom'
): FormData {
    const formData = new FormData();

    // Required fields
    if (frontendProject.name) {
        formData.append('project_name', frontendProject.name);
    }

    if (frontendProject.description) {
        formData.append('description', frontendProject.description);
    }

    if (frontendProject.documentType) {
        formData.append('document_type', frontendProject.documentType);
    }

    if (frontendProject.extractionMode) {
        formData.append('extraction_mode', frontendProject.extractionMode);
    }

    // Domain template (required by backend)
    formData.append('domain_template', domainTemplate);

    // Extraction model (convert to array)
    // if (frontendProject.llmConfig?.modelName) {
    //     formData.append('extraction_model', frontendProject.llmConfig.modelName);
    // } else {
    //     // Default model if none specified
    //     formData.append('extraction_model', 'gemini_flash');
    // }
    formData.append('extraction_model', 'gemini_flash');

    // Schema file or schema data
    if (schemaFile) {
        formData.append('extraction_schema_file', schemaFile);
    } else if (frontendProject.schema && frontendProject.schema.length > 0) {
        // Convert schema array to JSON and create blob
        const backendSchema = mapFrontendSchemaToBackend(frontendProject.schema);
        const schemaBlob = new Blob([JSON.stringify(backendSchema)], {
            type: 'application/json',
        });
        formData.append('extraction_schema_file', schemaBlob, 'schema.json');
    }

    return formData;
}

/**
 * Convert frontend project update data to backend FormData format
 */
export function mapFrontendProjectUpdateToBackendFormData(
    frontendProject: Partial<Project>,
    schemaFile?: File | null
): FormData {
    const formData = new FormData();

    // Only include fields that are being updated
    if (frontendProject.name) {
        formData.append('project_name', frontendProject.name);
    }

    if (frontendProject.description !== undefined) {
        formData.append('description', frontendProject.description);
    }

    // Schema update
    if (schemaFile) {
        formData.append('extraction_schema_file', schemaFile);
    } else if (frontendProject.schema && frontendProject.schema.length > 0) {
        const backendSchema = mapFrontendSchemaToBackend(frontendProject.schema);
        const schemaJson = JSON.stringify(backendSchema);
        formData.append('extraction_schema', schemaJson);
    }

    return formData;
}
