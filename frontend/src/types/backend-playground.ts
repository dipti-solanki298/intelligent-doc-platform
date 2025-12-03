// Backend Playground API Type Definitions

/**
 * Backend request format for playground extraction
 * Sent as FormData with multipart/form-data
 */
export interface BackendPlaygroundExtractRequest {
    project_id: string;
    document_type: string;
    file: File;
}

/**
 * Backend response format for playground extraction
 */
export interface BackendPlaygroundExtractResponse {
    file_id: string;
    extraction_result: {
        status: string;
        extracted_data: Record<string, any>;
    };
}

/**
 * Backend file download response
 */
export interface BackendFileDownloadResponse {
    blob: Blob;
    filename: string;
    contentType: string;
}
