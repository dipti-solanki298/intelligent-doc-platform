import { Database, Share2, Box } from 'lucide-react';

const VectorStore = () => {
    const connectors = [
        {
            name: 'qDrant',
            description: 'High-performance vector search engine.',
            status: 'Connected',
            icon: Database,
            color: 'bg-orange-500/10 text-orange-500'
        },
        {
            name: 'Pinecone',
            description: 'Managed vector database for ML applications.',
            status: 'Available',
            icon: Share2,
            color: 'bg-cyan-500/10 text-cyan-500'
        },
        {
            name: 'Weaviate',
            description: 'Open-source vector search engine.',
            status: 'Available',
            icon: Box,
            color: 'bg-green-500/10 text-green-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Vector Store</h2>
                <p className="text-muted-foreground mt-1">Manage your vector database connections and indices.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {connectors.map((connector) => (
                    <div key={connector.name} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${connector.color} group-hover:scale-110 transition-transform`}>
                                <connector.icon size={24} />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${connector.status === 'Connected'
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                {connector.status}
                            </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{connector.name}</h3>
                        <p className="text-sm text-muted-foreground">{connector.description}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Indexing Status</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Documents Indexed</span>
                        <span className="font-medium">1,248</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="font-medium">Just now</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div className="bg-primary h-2 rounded-full w-[98%]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VectorStore;
