import React, { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';

interface SqlViewerProps {
  title: string;
  code: string;
  description?: string;
}

export const SqlViewer: React.FC<SqlViewerProps> = ({ title, code, description }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-8 border border-gray-700 rounded-lg overflow-hidden bg-gray-900 shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          {description && <p className="text-gray-400 text-sm">{description}</p>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Clipboard size={14} />}
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
      </div>
      <div className="p-0 overflow-x-auto">
        <pre className="text-gray-300 text-sm font-mono p-4 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};