import { LuPackage, LuPackageOpen } from "react-icons/lu";

export default function PackageSelector() {
  return (
    <div className="flex w-4/12 flex-col justify-between border-l border-gray-200 pl-6">
      <div>
        <h3 className="mb-4 text-xl font-bold text-gray-800">Choose a Package</h3>
        <div className="space-y-3">
          <div className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-[#ff40b5] p-3">
            <div className="flex items-center gap-3">
              <LuPackage size={24} className="text-[#ff40b5]" />
              <div>
                <p className="font-bold">50 Stickers</p>
                <p className="text-sm text-gray-500">$0.85 / unit</p>
              </div>
            </div>
            <p className="font-bold text-xl text-[#ff40b5]">$42.50</p>
          </div>
          <div className="flex cursor-pointer items-center justify-between rounded-lg border-2 border-transparent p-3 hover:border-pink-400 hover:bg-pink-50">
            <div className="flex items-center gap-3">
              <LuPackageOpen size={24} className="text-[#ff40b5]" />
              <div>
                <p className="font-bold">100 Stickers</p>
                <p className="text-sm text-gray-500">$0.72 / unit</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl text-[#ff40b5]">$72.25</p>
              <span className="rounded-full bg-[#00d4ff] px-2 py-0.5 text-xs font-semibold text-white">Save 15%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-full rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-300">
          Save Draft
        </button>
        <button className="w-full rounded-lg bg-[#ff40b5] px-4 py-3 font-bold text-white hover:bg-[#03d1fb] cursor-pointer">
          Submit Order
        </button>
      </div>
    </div>
  );
}