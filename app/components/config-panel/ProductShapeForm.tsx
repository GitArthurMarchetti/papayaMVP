import { Design, DesignConfig, CutType } from '@/app/types';

interface ProductShapeFormProps {
  activeDesign: Design | null;
  handleConfigChange: <K extends keyof DesignConfig>(field: K, value: DesignConfig[K]) => void;
}

export default function ProductShapeForm({ activeDesign, handleConfigChange }: ProductShapeFormProps) {
  return (
    <>
      <h3 className="text-lg font-bold text-gray-800">1. Product & Shape</h3>
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-600">Product</label>
        <select
          value={activeDesign?.config.cutType || 'Die Cut'}
          disabled={!activeDesign}
          onChange={(e) => handleConfigChange('cutType', e.target.value as CutType)}
          className="w-full rounded-md border border-gray-300 bg-white p-2 font-semibold disabled:bg-gray-100"
        >
          <option value="Die Cut">Die Cut Sticker</option>
          <option value="Kiss Cut">Kiss Cut Sticker</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-600">Shape</label>
        <div className="space-y-2">
          <button
            onClick={() => handleConfigChange('shape', 'Contour')}
            disabled={!activeDesign || activeDesign.config.cutType === 'Kiss Cut'}
            className={`w-full rounded-md p-2 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-100 ${
              activeDesign?.config.shape === 'Contour' ? 'bg-[#00d4ff] text-white' : 'text-gray-700'
            }`}
          >
            Contour Cut
          </button>
          <button
            onClick={() => handleConfigChange('shape', 'Circle')}
            disabled={!activeDesign || activeDesign.config.cutType === 'Kiss Cut'}
            className={`w-full rounded-md p-2 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-100 ${
              activeDesign?.config.shape === 'Circle' ? 'bg-[#00d4ff] text-white' : 'text-gray-700'
            }`}
          >
            Circle
          </button>
          <button
            onClick={() => handleConfigChange('shape', 'Square')}
            disabled={!activeDesign}
            className={`w-full rounded-md p-2 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-100 ${
              activeDesign?.config.shape === 'Square' ? 'bg-[#00d4ff] text-white' : 'text-gray-700'
            }`}
          >
            Square
          </button>
        </div>
      </div>
    </>
  );
}