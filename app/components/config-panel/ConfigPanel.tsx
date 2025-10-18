import Image from 'next/image';
import { Design, DesignConfig, FinishType } from '@/app/types';
import PackageSelector from '../PackageSelector';
import ProductShapeForm from './ProductShapeForm';
import SpacingOptions from './SpacingOptions';

interface ConfigPanelProps {
  activeDesign: Design | null;
  handleConfigChange: <K extends keyof DesignConfig>(field: K, value: DesignConfig[K]) => void;
}

export default function ConfigPanel({ activeDesign, handleConfigChange }: ConfigPanelProps) {
  return (
    <div className="flex h-5/12 w-full flex-row gap-6 bg-white p-6 shadow-inner">
      <div className="flex w-8/12 flex-row gap-6">
        <div className="flex w-1/3 flex-col gap-4 overflow-y-auto pr-3">
          <ProductShapeForm activeDesign={activeDesign} handleConfigChange={handleConfigChange} />
          {activeDesign && <SpacingOptions activeDesign={activeDesign} handleConfigChange={handleConfigChange} />}
        </div>

        <div className="flex w-1/3 flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-800">2. Appearance</h3>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">Material</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={!activeDesign}
                onClick={() => handleConfigChange('material', 'Vinyl')}
                className={`flex flex-col items-center gap-1 rounded-md bg-gray-50 border-2 p-1 text-center disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
                  activeDesign?.config.material === 'Vinyl' ? 'border-[#00d4ff]' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image src="/vinyl.png" alt="Vinyl" width={40} height={40} />
                <span className="text-xs font-semibold">Vinyl</span>
              </button>
              <button
                disabled={!activeDesign}
                onClick={() => handleConfigChange('material', 'Holographic')}
                className={`flex flex-col items-center gap-1 bg-gray-50 rounded-md border-2 p-1 text-center disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
                  activeDesign?.config.material === 'Holographic' ? 'border-[#00d4ff]' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image src="/holographic.png" alt="Holographic" width={40} height={40} />
                <span className="text-xs font-semibold">Holographic</span>
              </button>
              <button
                disabled={!activeDesign}
                onClick={() => handleConfigChange('material', 'Transparent')}
                className={`flex flex-col items-center gap-1 bg-gray-50 rounded-md border-2 p-1 text-center disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
                  activeDesign?.config.material === 'Transparent' ? 'border-[#00d4ff]' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image src="/transparent.png" alt="Transparent" width={40} height={40} />
                <span className="text-xs font-semibold">Transparent</span>
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">Finish</label>
            <select
              disabled={!activeDesign}
              value={activeDesign?.config.finish || 'Glossy'}
              onChange={(e) => handleConfigChange('finish', e.target.value as FinishType)}
              className="w-full rounded-md border border-gray-300 bg-white p-2 font-semibold disabled:bg-gray-100"
            >
              <option value="Glossy">Glossy</option>
              <option value="Matte">Matte</option>
            </select>
          </div>
        </div>

        <div className="flex w-1/3 flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-800">3. Size & Quantity</h3>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">Size (cm)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                disabled={!activeDesign}
                value={activeDesign?.config.width || 10}
                onChange={(e) => handleConfigChange('width', Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 p-2 text-center disabled:bg-gray-100"
                placeholder="W"
              />
              <span className="font-bold text-gray-400">x</span>
              <input
                type="number"
                disabled={!activeDesign}
                value={activeDesign?.config.height || 10}
                onChange={(e) => handleConfigChange('height', Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 p-2 text-center disabled:bg-gray-100"
                placeholder="H"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-600">Quantity</label>
            <input
              type="number"
              disabled={!activeDesign}
              value={activeDesign?.config.quantity || 50}
              onChange={(e) => handleConfigChange('quantity', Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 p-2 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>
      <PackageSelector />
    </div>
  );
}