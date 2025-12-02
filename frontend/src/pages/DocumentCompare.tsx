import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PDFViewer from '@/components/PDFViewer';
import ExtractionEditor, { ExtractedField } from '@/components/ExtractionEditor';

// Mock Data
const MOCK_PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'; // Sample PDF

const INITIAL_DATA: ExtractedField[] = [
    { id: '1', key: 'Invoice Number', value: 'INV-2023-001', confidence: 0.98, pageRef: 1 },
    { id: '2', key: 'Vendor Name', value: 'Acme Corp', confidence: 0.95, pageRef: 1 },
    { id: '3', key: 'Date', value: '2023-10-27', confidence: 0.92, pageRef: 1 },
    { id: '4', key: 'Total Amount', value: '$1,250.00', confidence: 0.85, pageRef: 1 },
    { id: '5', key: 'Tax ID', value: 'US-123456789', confidence: 0.65, pageRef: 1 },
    { id: '6', key: 'Line Item 1', value: 'Consulting Services', confidence: 0.88, pageRef: 2 },
];

const DocumentCompare = () => {
    const location = useLocation();
    const [extractionData, setExtractionData] = useState<ExtractedField[]>(INITIAL_DATA);
    const [pdfUrl, setPdfUrl] = useState<string>(MOCK_PDF_URL);
    const [fileName, setFileName] = useState<string>('invoice_oct_2023.pdf');

    useEffect(() => {
        if (location.state) {
            if (location.state.extractionData) {
                setExtractionData(location.state.extractionData);
            }
            if (location.state.fileUrl) {
                setPdfUrl(location.state.fileUrl);
            }
            if (location.state.fileName) {
                setFileName(location.state.fileName);
            }
        }
    }, [location.state]);

    const handleUpdateField = (id: string, newValue: string) => {
        setExtractionData(prev =>
            prev.map(field => field.id === id ? { ...field, value: newValue } : field)
        );
    };

    return (
        <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col">
            <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
                <h2 className="font-bold text-lg">Document Comparison</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>File: {fileName}</span>
                    <span className="h-4 w-px bg-border"></span>
                    <span>Model: GPT-4-Turbo</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: PDF Viewer */}
                <div className="w-1/2 h-full relative">
                    <PDFViewer url={pdfUrl} />
                </div>

                {/* Right Pane: Extraction Editor */}
                <div className="w-1/2 h-full border-l border-border">
                    <ExtractionEditor
                        data={extractionData}
                        onUpdate={handleUpdateField}
                    />
                </div>
            </div>
        </div>
    );
};

export default DocumentCompare;
