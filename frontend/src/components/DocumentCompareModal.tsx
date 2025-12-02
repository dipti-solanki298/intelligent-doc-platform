import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PDFViewer from '@/components/PDFViewer';
import ExtractionEditor, { ExtractedField } from '@/components/ExtractionEditor';

interface DocumentCompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    extractionData: ExtractedField[];
    onUpdateField: (id: string, newValue: string) => void;
}

const DocumentCompareModal: React.FC<DocumentCompareModalProps> = ({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    extractionData,
    onUpdateField
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background border border-border w-full max-w-7xl h-[90vh] rounded-xl shadow-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold">Document Comparison</h2>
                        <p className="text-sm text-muted-foreground">Reviewing: {fileName}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Pane: PDF Viewer */}
                    <div className="w-1/2 h-full relative bg-muted/10">
                        <PDFViewer url={fileUrl} />
                    </div>

                    {/* Right Pane: Extraction Editor */}
                    <div className="w-1/2 h-full border-l border-border bg-card">
                        <ExtractionEditor
                            data={extractionData}
                            onUpdate={onUpdateField}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/10">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={onClose}>Save & Continue</Button>
                </div>
            </div>
        </div>
    );
};

export default DocumentCompareModal;
