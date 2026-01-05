import React from 'react';
import { Network } from 'lucide-react';
import { SqlViewer } from '../components/SqlViewer';
import { openApiYaml } from '../services/apiSpec';

export const ApiDocs = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">API Specification</h1>
        <p className="text-slate-600">
          Dokumentasi REST API standard (OpenAPI 3.0) untuk integrasi Frontend Web & Mobile.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 items-start">
         <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Network size={24} />
         </div>
         <div>
            <h3 className="font-bold text-blue-900">Endpoints Overview</h3>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed">
              API ini menggunakan arsitektur RESTful di atas Supabase. 
              Semua request wajib menyertakan header <code>Authorization: Bearer [JWT]</code> kecuali Login.
              Payload request dan response menggunakan format <code>application/json</code>.
            </p>
         </div>
      </div>

      <SqlViewer 
        title="openapi.yaml" 
        description="Salin definisi ini ke Swagger Editor atau Postman untuk testing."
        code={openApiYaml}
      />
    </div>
  );
};
