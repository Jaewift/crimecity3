import { useState } from 'react';
import { Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, modelId: string) => void;
  initialKey: string;
  initialModelId: string;
}

export function SettingsModal({ isOpen, onClose, onSave, initialKey, initialModelId }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [modelId, setModelId] = useState(initialModelId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Fish Audio 설정
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Fish Audio API Key를 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Model ID (주성철)</label>
            <input 
              type="text" 
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="모델 ID를 입력하세요"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button 
              onClick={() => {
                onSave(apiKey, modelId);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
