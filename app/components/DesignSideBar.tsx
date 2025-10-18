import { useRef, ChangeEvent, MouseEvent } from 'react';
import Image from 'next/image';
import { FaUpload, FaTrash } from 'react-icons/fa';
import { IoMdImages } from 'react-icons/io';
import { Design } from '../types';

interface DesignSidebarProps {
  designs: Design[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleDelete: (event: MouseEvent, id: string) => void;
}

export default function DesignSidebar({
  designs,
  activeIndex,
  setActiveIndex,
  handleFileChange,
  handleDelete,
}: DesignSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full w-2/12 flex-col bg-white p-6 shadow-lg">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
        <IoMdImages className="text-[#00d4ff]" />
        Your Designs
      </h2>
      <div className="flex-grow overflow-y-auto overflow-x-hidden pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setActiveIndex(-1)}
            className={`group relative aspect-square cursor-pointer rounded-lg border-2 transition-all ${
              activeIndex === -1 ? 'border-[#00d4ff]' : 'border-gray-200 hover:border-[#00d4ff]'
            }`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-100">
              <span className="text-2xl font-bold text-gray-500">All</span>
            </div>
          </div>
          {designs.map((design, index) => (
            <div
              key={design.id}
              onClick={() => setActiveIndex(index)}
              className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                activeIndex === index ? 'border-[#00d4ff]' : 'border-transparent hover:border-[#00d4ff]'
              }`}
            >
              <Image
                src={design.src}
                alt={design.name}
                layout="fill"
                objectFit="cover"
                className="transition-transform group-hover:scale-105"
              />
              <div className="absolute left-0 top-0 m-1 rounded bg-black bg-opacity-50 px-1.5 py-0.5 text-xs font-bold text-white">
                D{index + 1}
              </div>
              <button
                onClick={(e) => handleDelete(e, design.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black bg-opacity-40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                aria-label="Remove design"
              >
                <FaTrash size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff40b5] py-3 font-bold text-white hover:bg-[#00d4ff]"
      >
        <FaUpload /> Upload File
      </button>
    </div>
  );
}