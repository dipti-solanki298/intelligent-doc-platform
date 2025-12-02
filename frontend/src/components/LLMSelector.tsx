import React from 'react';
import { Select, Label } from '@/components/ui';
import { LLMConnection } from '@/types';

// Mock connections for now, in a real app this would come from a context or API
const MOCK_CONNECTIONS: LLMConnection[] = [
    { id: '1', name: 'My OpenAI', provider: 'OpenAI', apiKey: 'sk-...', modelName: 'gpt-4-turbo', isDefault: true },
    { id: '2', name: 'Corporate Gemini', provider: 'Gemini', apiKey: 'AI...', modelName: 'gemini-1.5-pro' },
];

interface LLMSelectorProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

const LLMSelector: React.FC<LLMSelectorProps> = ({ value, onChange, label = "Select LLM Model", className }) => {
    return (
        <div className={className}>
            <Label className="mb-2 block">{label}</Label>
            <Select
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" disabled>Select a model...</option>
                {MOCK_CONNECTIONS.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                        {conn.name} ({conn.provider} - {conn.modelName})
                    </option>
                ))}
            </Select>
        </div>
    );
};

export default LLMSelector;
