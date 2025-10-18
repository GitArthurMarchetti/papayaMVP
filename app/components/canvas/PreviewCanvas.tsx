import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Design } from '@/app/types';
import { generateAndDrawOutline } from '@/app/lib/canvas';
import { DIE_CUT_COLOR } from '@/app/lib/constants';

const SizeAnnotation = ({
    orientation,
    value,
  }: {
    orientation: 'width' | 'height';
    value: number;
  }) => {
    const isWidth = orientation === 'width';
    return (
      <div
        className={`absolute flex items-center justify-center font-bold`}
        style={{
          color: DIE_CUT_COLOR,
          ...(isWidth
            ? { top: '-25px', left: '0', right: '0', flexDirection: 'column' }
            : { right: '-35px', top: '0', bottom: '0', flexDirection: 'column' }),
        }}
      >
        {/* Line 1 */}
        <div style={{ [isWidth ? 'height' : 'width']: '10px', backgroundColor: DIE_CUT_COLOR, ...(isWidth ? {width: '2px'} : {height: '2px'}) }} />
        {/* Main line */}
        <div style={{ [isWidth ? 'width' : 'height']: '100%', backgroundColor: DIE_CUT_COLOR, ...(isWidth ? {height: '2px'} : {width: '2px'}) }} />
        {/* Line 2 */}
        <div style={{ [isWidth ? 'height' : 'width']: '10px', backgroundColor: DIE_CUT_COLOR, ...(isWidth ? {width: '2px'} : {height: '2px'}) }} />
        
        <span
          className="absolute"
          style={isWidth 
              ? { top: '-20px' }
              : { 
                  top: '50%',
                  left: '12px', 
                  transform: 'translateY(-50%)', 
                  whiteSpace: 'nowrap' 
                }
          }
        >
          {value.toFixed(1)} cm
        </span>
      </div>
    );
  };

interface PreviewCanvasProps {
  designs: Design[];
  activeDesign: Design | null;
}

export default function PreviewCanvas({ designs, activeDesign }: PreviewCanvasProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!activeDesign) {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      generateAndDrawOutline(img, activeDesign.config, previewCanvasRef.current);
    };
    img.src = activeDesign.src;
  }, [activeDesign]);

  return (
    <div
      className="flex h-7/12 w-full flex-col items-center justify-center bg-gray-200 p-8"
      style={{
        backgroundImage: 'repeating-conic-gradient(#e0e0e0 0% 25%, #f0f0f0 0% 50%)',
        backgroundSize: '20px 20px',
      }}
    >
      {activeDesign ? (
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative">
            <canvas ref={previewCanvasRef} className="max-h-full max-w-full" />
            <SizeAnnotation orientation="width" value={activeDesign.config.width} />
            <SizeAnnotation orientation="height" value={activeDesign.config.height} />
          </div>
          <div className="mt-8 rounded-md bg-white bg-opacity-70 px-3 py-1 font-mono text-sm font-semibold text-black">
            <span>P{activeDesign.id.substring(0, 8).toUpperCase()}</span>
            <span className="mx-2">/</span>
            <span>{activeDesign.config.material} {activeDesign.config.finish}</span>
            <span className="mx-2">/</span>
            <span>{activeDesign.config.quantity}</span>
          </div>
        </div>
      ) : designs.length > 0 ? (
        <div className="flex h-full w-full flex-wrap content-start items-start justify-center gap-4 overflow-y-auto rounded-lg bg-white/20 p-4">
          {designs.map((design, index) => (
            <div key={design.id} className="relative rounded-md bg-white p-1 shadow-md">
              <Image src={design.src} alt={design.name} width={100} height={100} objectFit="contain" />
              <div className="absolute -right-1 -top-1 rounded-full bg-black bg-opacity-60 px-1.5 py-0.5 text-xs font-bold text-white">
                D{index + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[300px] w-[300px] items-center justify-center rounded-lg bg-white p-2 text-center text-gray-500 shadow-2xl">
          <span>Select or upload a design to see a preview</span>
        </div>
      )}
    </div>
  );
}