import { ExtractedField } from '@/components/ExtractionEditor';
import { BackendPlaygroundExtractResponse } from '@/types/backend-playground';

/**
 * Map backend extraction response to frontend ExtractedField format
 * 
 * @param backendResponse - Response from /playground/extract endpoint
 * @returns Array of ExtractedField objects for display in UI
 */
export function mapBackendExtractionToFrontend(
    backendResponse: BackendPlaygroundExtractResponse
): ExtractedField[] {
    const extractedData = backendResponse.extraction_result.extracted_data;

    // Convert object to array of ExtractedField
    return Object.entries(extractedData).map(([key, value], index) => ({
        id: String(index + 1),
        key: formatFieldKey(key),
        value: String(value),
        confidence: 0.85, // Backend doesn't provide confidence yet - using default
        pageRef: 1, // Backend doesn't provide page reference yet - using default
    }));
}

/**
 * Format field key for display
 * Converts snake_case to Title Case
 * 
 * @param key - Field key in snake_case format
 * @returns Formatted key in Title Case
 * 
 * @example
 * formatFieldKey('invoice_number') // returns 'Invoice Number'
 * formatFieldKey('total_amount') // returns 'Total Amount'
 */
function formatFieldKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Build FormData for playground extraction request
 * 
 * @param projectId - ID of the project to use for extraction
 * @param documentType - Type of document (PDF, Images, etc.)
 * @param file - File to upload and extract
 * @returns FormData object ready to send to backend
 */
export function buildPlaygroundExtractionFormData(
    projectId: string,
    documentType: string,
    file: File
): FormData {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('document_type', documentType.toLowerCase()); // Backend expects lowercase
    formData.append('file', file);
    return formData;
}
