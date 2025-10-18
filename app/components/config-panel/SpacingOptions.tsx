import { Design, DesignConfig } from '@/app/types';

interface SpacingOptionsProps {
  activeDesign: Design;
  handleConfigChange: <K extends keyof DesignConfig>(field: K, value: DesignConfig[K]) => void;
}

export default function SpacingOptions({ activeDesign, handleConfigChange }: SpacingOptionsProps) {
  return (
    <div className="mt-2 space-y-4 rounded-md border bg-gray-50 p-3">
      {activeDesign.config.cutType === 'Die Cut' && (
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-600">Spacing</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleConfigChange('outerGap', 0)}
              className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${
                activeDesign.config.outerGap === 0 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              No Space
            </button>
            <button
              onClick={() => handleConfigChange('outerGap', 10)}
              className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${
                activeDesign.config.outerGap === 10 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              10px
            </button>
          </div>
        </div>
      )}

      {activeDesign.config.cutType === 'Kiss Cut' && (
        <>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">Outer Spacing (blue)</label>
            <div className="grid grid-cols-2 gap-2">
               <button
                  onClick={() => handleConfigChange('outerGap', 0)}
                  className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${
                    activeDesign.config.outerGap === 0 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No Space
                </button>
                <button
                  onClick={() => handleConfigChange('outerGap', 10)}
                  className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${
                    activeDesign.config.outerGap === 10 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  10px
                </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-gray-600">
              Inner Spacing (pink): {activeDesign.config.innerGap}px
            </label>
            <input
              type="range"
              min="2"
              max="50"
              value={activeDesign.config.innerGap}
              onChange={(e) => handleConfigChange('innerGap', Number(e.target.value))}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
}