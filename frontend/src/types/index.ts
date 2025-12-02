export type DocumentType = 'PDF' | 'Images' | 'Scanned' | 'Handwritten';
export type ExtractionMode = 'Field Extraction' | 'Classification' | 'Summarization' | 'Hybrid';

export type LLMProvider = 'OpenAI' | 'Gemini' | 'Claude' | 'Custom';

export interface LLMConnection {
    id: string;
    name: string;
    provider: LLMProvider;
    apiKey?: string;
    baseUrl?: string; // For custom/local LLMs
    modelName?: string; // Default model
    isDefault?: boolean;
}

export interface ExtractionSchemaItem {
    id: string;
    key: string;
    description: string; // The LLM prompt/description
    type: 'string' | 'number' | 'date' | 'array' | 'object';
    required: boolean;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    documentType: DocumentType;
    extractionMode: ExtractionMode;
    schema?: ExtractionSchemaItem[];
    llmConfig?: {
        connectionId: string;
        modelName: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface PromptVersion {
    id: string;
    version: number;
    content: string;
    schema: any; // TODO: Define schema type
    createdAt: string;
}
