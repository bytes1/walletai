// frontend/src/components/SolidityCode/index.tsx
"use client";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SolidityCodeProps {
  code: string;
}

const SolidityCode: React.FC<SolidityCodeProps> = ({ code: initialCode }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(initialCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl rounded-2xl bg-[#1e1e1e] shadow-lg border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-t-2xl">
        <span className="text-sm font-semibold text-gray-400">Solidity Code</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      {/* Code Block */}
      <div className="text-sm">
        {isEditing ? (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 p-4 bg-[#1e1e1e] text-white font-mono border-0 focus:ring-0 resize-none"
          />
        ) : (
          <SyntaxHighlighter language="solidity" style={vscDarkPlus} showLineNumbers>
            {code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};

export default SolidityCode;
