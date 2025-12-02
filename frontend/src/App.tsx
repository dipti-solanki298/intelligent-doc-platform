import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import PromptStudio from '@/pages/PromptStudio';
import Playground from '@/pages/Playground';
import DocumentCompare from '@/pages/DocumentCompare';
import Settings from '@/pages/Settings';
import VectorStore from '@/pages/VectorStore';
import WorkflowAutomation from '@/pages/WorkflowAutomation';
import HealthcareClaimAutomation from '@/pages/workflows/HealthcareClaimAutomation';
import SAPCashAppAutomation from '@/pages/workflows/SAPCashAppAutomation';
import PipelineBuilder from '@/pages/PipelineBuilder';

function App() {
  const { checkAuth } = useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/prompt-studio" replace />} />
              <Route path="prompt-studio" element={<PromptStudio />} />
              <Route path="playground" element={<Playground />} />
              <Route path="compare" element={<DocumentCompare />} />
              <Route path="vector-store" element={<VectorStore />} />
              <Route path="settings" element={<Settings />} />
              <Route path="workflow-automation" element={<WorkflowAutomation />} />
              <Route path="workflow-automation/healthcare-claim" element={<HealthcareClaimAutomation />} />
              <Route path="workflow-automation/sap-cash-app" element={<SAPCashAppAutomation />} />
              <Route path="pipeline-builder" element={<PipelineBuilder />} />
            </Route>
          </Route>
        </Routes>
      </Router>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;

