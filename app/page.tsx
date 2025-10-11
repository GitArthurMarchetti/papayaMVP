'use client';

import Image from 'next/image';
import { FaUpload, FaTrash } from 'react-icons/fa';
import { IoMdImages } from 'react-icons/io';
import { LuPackage, LuPackageOpen } from "react-icons/lu";
import { useState, useRef, useEffect, ChangeEvent, MouseEvent } from 'react';

// ================================================================== //
// 1. TIPOS DE DADOS E ESTADO                                         //
// ================================================================== //

type CutType = 'Die Cut' | 'Kiss Cut';
type ShapeType = 'Contour' | 'Circle' | 'Square';

type DesignConfig = {
  cutType: CutType;
  shape: ShapeType;
  outerGap: number; 
  innerGap: number;
};

type Design = {
  id: string;
  name: string;
  src: string;
  config: DesignConfig;
};

const FIXED_SMOOTHNESS = 4;
const FIXED_TOLERANCE = 0;

const DIE_CUT_COLOR = '#00AAFF'; // Azul
const KISS_CUT_COLOR = '#FF40B5'; // Rosa

export default function StickerProofPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [designs, setDesigns] = useState<Design[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const activeDesign = activeIndex > -1 ? designs[activeIndex] : null;

  // ================================================================== //
  // 2. FUNÇÕES DE LÓGICA E MANIPULAÇÃO DE DADOS                       //
  // ================================================================== //
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const newDesign: Design = {
      id: crypto.randomUUID(),
      name: file.name,
      src: URL.createObjectURL(file),
      config: {
        cutType: 'Die Cut',
        shape: 'Contour',
        outerGap: 10,
        innerGap: 10, 
      },
    };

    setDesigns(prevDesigns => {
      const updatedDesigns = [...prevDesigns, newDesign];
      setActiveIndex(updatedDesigns.length - 1);
      return updatedDesigns;
    });

    event.target.value = '';
  };

  const handleDelete = (event: MouseEvent, idToDelete: string) => {
    event.stopPropagation();
    const designToDelete = designs.find(d => d.id === idToDelete);
    if (designToDelete?.src.startsWith('blob:')) {
      URL.revokeObjectURL(designToDelete.src);
    }
    setDesigns(prevDesigns => {
      const remainingDesigns = prevDesigns.filter(design => design.id !== idToDelete);
      if (activeIndex >= remainingDesigns.length) {
        setActiveIndex(remainingDesigns.length - 1);
      }
      return remainingDesigns;
    });
  };

  const handleConfigChange = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K]
  ) => {
    if (!activeDesign) return;
    setDesigns(currentDesigns => 
      currentDesigns.map(design => {
        if (design.id === activeDesign.id) {
          const newConfig = { ...design.config, [field]: value };
          if (field === 'cutType' && value === 'Kiss Cut') {
            newConfig.shape = 'Square';
          }
          return { ...design, config: newConfig };
        }
        return design;
      })
    );
  };

  useEffect(() => {
    if (!activeDesign || !previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0,0, canvas.width, canvas.height);
      }
      return;
    };

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        generateAndDrawOutline(img, activeDesign.config);
    };
    img.src = activeDesign.src;
    
  }, [activeDesign]);

  // ================================================================== //
  // 3. LÓGICA DE DESENHO NO CANVAS                                     //
  // ================================================================== //

  const generateAndDrawOutline = (img: HTMLImageElement, config: DesignConfig) => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const lineWidth = 2;
    const maxGap = Math.max(config.outerGap, config.innerGap);
    const pad = maxGap + lineWidth + 2;
    const baseW = img.width;
    const baseH = img.height;
    
    const outW = baseW + pad * 2;
    const outH = baseH + pad * 2;
    previewCanvas.width = outW;
    previewCanvas.height = outH;
    const dctx = previewCanvas.getContext('2d');
    if (!dctx) return;

    dctx.clearRect(0, 0, outW, outH);
    dctx.drawImage(img, pad, pad);
    dctx.lineWidth = lineWidth;

    if (config.cutType === 'Die Cut') {
      dctx.strokeStyle = DIE_CUT_COLOR;
      const gap = config.outerGap;
      switch (config.shape) {
        case 'Contour':
          drawContourOutlines(img, dctx, DIE_CUT_COLOR, pad, gap);
          break;
        case 'Square':
          dctx.strokeRect(pad - gap, pad - gap, baseW + gap * 2, baseH + gap * 2);
          break;
        case 'Circle':
          const centerX = pad + baseW / 2;
          const centerY = pad + baseH / 2;
          const radius = Math.max(baseW, baseH) / 2 + gap;
          dctx.beginPath();
          dctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          dctx.stroke();
          break;
      }
    } else if (config.cutType === 'Kiss Cut') {
      const { allContoursMask, overallBoundingBox } = generateMultiContourData(img, KISS_CUT_COLOR, config.innerGap, pad);
      
      if (allContoursMask) {
        dctx.drawImage(allContoursMask, 0, 0, outW, outH);
      }
      
      if (overallBoundingBox) {
        dctx.strokeStyle = DIE_CUT_COLOR;
        const gap = config.outerGap;
        dctx.strokeRect(
          overallBoundingBox.minX + pad - gap,
          overallBoundingBox.minY + pad - gap,
          overallBoundingBox.width + (gap * 2),
          overallBoundingBox.height + (gap * 2)
        );
      }
    }
  };
  
  const drawContourOutlines = (img: HTMLImageElement, finalCtx: CanvasRenderingContext2D, lineColor: string, pad: number, gap: number) => {
    const { allContoursMask } = generateContourCanvas(img, lineColor, false, gap, pad);
    if (allContoursMask) {
      finalCtx.drawImage(allContoursMask, 0, 0, finalCtx.canvas.width, finalCtx.canvas.height);
    }
  };

  const generateMultiContourData = (img: HTMLImageElement, lineColor: string, innerGap: number, pad: number) => {
    return generateContourCanvas(img, lineColor, false, innerGap, pad);
  };
  
  const generateContourCanvas = (img: HTMLImageElement, lineColor: string, keepLargest: boolean, gap: number, pad: number) => {
      const lineWidth = 2;
      const ss = FIXED_SMOOTHNESS;
      const baseW = img.width, baseH = img.height;
      const workW = (baseW + pad * 2) * ss;
      const workH = (baseH + pad * 2) * ss;
  
      const workCanvas = document.createElement('canvas');
      workCanvas.width = workW; workCanvas.height = workH;
      const wctx = workCanvas.getContext('2d');
      if (!wctx) return { allContoursMask: null, overallBoundingBox: null };
  
      wctx.drawImage(img, 0, 0, baseW, baseH, pad * ss, pad * ss, baseW * ss, baseH * ss);
      const imgData = wctx.getImageData(0, 0, workW, workH);
      const mask = buildObjectMask(imgData, FIXED_TOLERANCE, ss);
      wctx.clearRect(0, 0, workW, workH);
      if (!hasAny(mask)) return { allContoursMask: null, overallBoundingBox: null };

      const components = keepLargest ? [getLargestComponentMask(mask, workW, workH)] : getAllComponentMasks(mask, workW, workH);

      const out = wctx.createImageData(workW, workH);
      const { r, g, b } = hexToRgb(lineColor);

      for (const componentMask of components) {
        if(!hasAny(componentMask)) continue;
          const dist = chamferDistance(componentMask, workW, workH);
          const scale = 3;
          const low = gap * scale * ss;
          const high = (gap + lineWidth) * scale * ss;
          for (let i = 0; i < componentMask.length; i++) {
              if (!componentMask[i] && dist[i] >= low && dist[i] < high) {
                  const k = i * 4;
                  out.data[k] = r; out.data[k+1] = g; out.data[k+2] = b; out.data[k+3] = 255;
              }
          }
      }
      wctx.putImageData(out, 0, 0);

      const overallBoundingBox = keepLargest ? null : getMaskBoundingBox(mask, workW, workH, ss, pad);

      return { allContoursMask: workCanvas, overallBoundingBox };
  }
  
  return (
    <div className="flex h-screen w-screen flex-col bg-gray-100 font-sans">
      <header className="flex h-[8%] w-full items-center justify-between bg-white px-10 shadow-md">
        <Image
          height={200}
          width={200}
          alt=''
          src={'/logo-1.png.webp'}
        />
      </header>
      <div className="flex h-[92%] w-full flex-row">
        <div className="flex h-full w-2/12 flex-col bg-white p-6 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
            <IoMdImages className="text-[#00d4ff]" />
            Your Designs
          </h2>
          <div className="flex-grow overflow-y-auto overflow-x-hidden pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setActiveIndex(-1)}
                className={`group relative aspect-square cursor-pointer rounded-lg border-2 transition-all ${activeIndex === -1 ? 'border-[#00d4ff]' : 'border-gray-200 hover:border-[#00d4ff]'}`}
              >
                <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-100">
                  <span className="text-2xl font-bold text-gray-500">All</span>
                </div>
              </div>
              {designs.map((design, index) => (
                <div
                  key={design.id}
                  onClick={() => setActiveIndex(index)}
                  className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${activeIndex === index ? 'border-[#00d4ff]' : 'border-transparent hover:border-[#00d4ff]'}`}
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
        
        <section className="h-full w-10/12">
          <div className="flex h-7/12 w-full items-center justify-center bg-gray-200 p-8"
            style={{
              backgroundImage: 'repeating-conic-gradient(#e0e0e0 0% 25%, #f0f0f0 0% 50%)',
              backgroundSize: '20px 20px',
            }}
          >
            {activeDesign ? (
              <canvas
                ref={previewCanvasRef}
                className="max-h-full max-w-full"
              />
            ) : designs.length > 0 ? (
                <div className="flex h-full w-full flex-wrap content-start items-start justify-center gap-4 overflow-y-auto rounded-lg bg-white/20 p-4">
                  {designs.map((design, index) => (
                    <div key={design.id} className="relative rounded-md bg-white p-1 shadow-md">
                       <Image src={design.src} alt={design.name} width={100} height={100} objectFit="contain" />
                       <div className="absolute -right-1 -top-1 rounded-full bg-black bg-opacity-60 px-1.5 py-0.5 text-xs font-bold text-white">D{index + 1}</div>
                    </div>
                  ))}
                </div>
            ) : (
                <div className="flex h-[300px] w-[300px] items-center justify-center rounded-lg bg-white p-2 text-center text-gray-500 shadow-2xl">
                  <span>Select or upload a design to see a preview</span>
                </div>
            )}
          </div>
          
          <div className="flex h-5/12 w-full flex-row gap-6 bg-white p-6 shadow-inner">
            <div className="flex w-8/12 flex-row gap-6">
              <div className="flex w-1/3 flex-col gap-4 overflow-y-auto pr-3">
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
                      className={`w-full rounded-md p-2 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-100 ${activeDesign?.config.shape === 'Contour' ? 'bg-[#00d4ff] text-white' : 'text-gray-700'}`}
                    >
                      Contour Cut
                    </button>
                    <button
                      onClick={() => handleConfigChange('shape', 'Circle')}
                      disabled={!activeDesign || activeDesign.config.cutType === 'Kiss Cut'}
                      className={`w-full rounded-md p-2 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-100 ${activeDesign?.config.shape === 'Circle' ? 'bg-[#00d4ff] text-white' : 'text-gray-700'}`}
                    >
                      Circle
                    </button>
                    <button
                      onClick={() => handleConfigChange('shape', 'Square')}
                      disabled={!activeDesign}
                      className={`w-full rounded-md p-2 text-left font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 hover:bg-gray-100 ${activeDesign?.config.shape === 'Square' ? 'bg-[#00d4ff] text-white' : 'text-gray-700'}`}
                    >
                      Square
                    </button>
                  </div>
                </div>

                {activeDesign && (
                  <div className="mt-2 space-y-4 rounded-md border bg-gray-50 p-3">
                    {activeDesign.config.cutType === 'Die Cut' && (
                       <div>
                        <label className="mb-2 block text-sm font-bold text-gray-600">Espaçamento</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleConfigChange('outerGap', 0)}
                            className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${activeDesign.config.outerGap === 0 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            Sem Espaço
                          </button>
                          <button
                            onClick={() => handleConfigChange('outerGap', 10)}
                            className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${activeDesign.config.outerGap === 10 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            10px
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activeDesign.config.cutType === 'Kiss Cut' && (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-bold text-gray-600">Espaçamento Externo (azul)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleConfigChange('outerGap', 0)}
                              className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${activeDesign.config.outerGap === 0 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              Sem Espaço
                            </button>
                            <button
                              onClick={() => handleConfigChange('outerGap', 10)}
                              className={`rounded-md p-2 text-center font-semibold transition-colors text-sm ${activeDesign.config.outerGap === 10 ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              10px
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold text-gray-600">Espaçamento Interno (rosa): {activeDesign.config.innerGap}px</label>
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
                )}
              </div>
              
              {/* =========== COLUNAS RESTAURADAS =========== */}
              <div className="flex w-1/3 flex-col gap-4">
                <h3 className="text-lg font-bold text-gray-800">2. Appearance</h3>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-600">Material</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="flex flex-col items-center gap-1 rounded-md border-2 border-[#00d4ff] p-1 text-center">
                      <Image src="/material-vinyl.png" alt="Vinyl" width={40} height={40} />
                      <span className="text-xs font-semibold">Vinyl</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 rounded-md border-2 border-transparent p-1 text-center hover:border-gray-300">
                      <Image src="/material-holographic.png" alt="Holographic" width={40} height={40} />
                      <span className="text-xs font-semibold">Holographic</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 rounded-md border-2 border-transparent p-1 text-center hover:border-gray-300">
                      <Image src="/material-transparent.png" alt="Transparent" width={40} height={40} />
                      <span className="text-xs font-semibold">Transparent</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-600">Finish</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white p-2 font-semibold">
                    <option>Glossy</option>
                    <option>Matte</option>
                  </select>
                </div>
              </div>

              <div className="flex w-1/3 flex-col gap-4">
                <h3 className="text-lg font-bold text-gray-800">3. Size & Quantity</h3>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-600">Size (cm)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue="10" className="w-full rounded-md border border-gray-300 p-2 text-center" placeholder="W" />
                    <span className="font-bold text-gray-400">x</span>
                    <input type="number" defaultValue="10" className="w-full rounded-md border border-gray-300 p-2 text-center" placeholder="H" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-600">Quantity</label>
                  <input type="number" defaultValue="50" className="w-full rounded-md border border-gray-300 p-2" />
                </div>
              </div>
              {/* ============================================= */}
            </div>

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
                  <button className="w-full rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-300">Save Draft</button>
                  <button className="w-full rounded-lg bg-[#ff40b5] px-4 py-3 font-bold text-white hover:bg-[#03d1fb] cursor-pointer">Submit Order</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ================================================================== //
// 5. FUNÇÕES AUXILIARES DE PROCESSAMENTO DE IMAGEM                   //
// ================================================================== //
function getMaskBoundingBox(mask: Uint8Array, w: number, h: number, ss: number, pad: number) {
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (mask[y * w + x]) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    const finalMinX = minX / ss - pad;
    const finalMinY = minY / ss - pad;
    const finalMaxX = maxX / ss - pad;
    const finalMaxY = maxY / ss - pad;

    return {
        minX: finalMinX,
        minY: finalMinY,
        width: finalMaxX - finalMinX,
        height: finalMaxY - finalMinY,
    };
}
function getLargestComponentMask(mask: Uint8Array, w: number, h: number): Uint8Array {
    const { labeledMask, labelCount } = findAllComponents(mask, w, h);
    if (labelCount === 0) return new Uint8Array(mask.length);
    const sizes = new Array(labelCount + 1).fill(0);
    for (let i = 0; i < labeledMask.length; i++) {
        if (labeledMask[i] > 0) {
            sizes[labeledMask[i]]++;
        }
    }
    let largestLabel = 0, maxSize = 0;
    for (let i = 1; i <= labelCount; i++) {
        if (sizes[i] > maxSize) {
            maxSize = sizes[i];
            largestLabel = i;
        }
    }
    const largestComponentMask = new Uint8Array(mask.length);
    for (let i = 0; i < labeledMask.length; i++) {
        if (labeledMask[i] === largestLabel) {
            largestComponentMask[i] = 1;
        }
    }
    return largestComponentMask;
}
function getAllComponentMasks(mask: Uint8Array, w: number, h: number): Uint8Array[] {
    const { labeledMask, labelCount } = findAllComponents(mask, w, h);
    if (labelCount === 0) return [];
    const components: Uint8Array[] = [];
    for (let i = 1; i <= labelCount; i++) {
        const componentMask = new Uint8Array(mask.length);
        for (let j = 0; j < labeledMask.length; j++) {
            if (labeledMask[j] === i) {
                componentMask[j] = 1;
            }
        }
        components.push(componentMask);
    }
    return components;
}
function findAllComponents(mask: Uint8Array, w: number, h: number) {
    const labeledMask = new Uint32Array(mask.length);
    let labelCount = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] && !labeledMask[i]) {
            labelCount++;
            const q = [i];
            labeledMask[i] = labelCount;
            let head = 0;
            while (head < q.length) {
                const p = q[head++];
                const x = p % w;
                const y = Math.floor(p / w);
                for (const [dx, dy] of dirs) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const ni = ny * w + nx;
                        if (mask[ni] && !labeledMask[ni]) {
                            labeledMask[ni] = labelCount;
                            q.push(ni);
                        }
                    }
                }
            }
        }
    }
    return { labeledMask, labelCount };
}
function buildObjectMask(imgData: ImageData, tol: number, ss: number): Uint8Array {
    const { data, width, height } = imgData;
    const mask = new Uint8Array(width * height);
    let hasAlpha = false, hasTransparent = false;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 255) hasAlpha = true;
        if (data[i + 3] === 0) hasTransparent = true;
    }
    if (hasAlpha && hasTransparent) {
        for (let i = 0, p = 0; i < data.length; i += 4, p++) mask[p] = data[i + 3] > 0 ? 1 : 0;
        if (ss > 1) closeMask(mask, width, height);
        return mask;
    }
    const r0 = data[0], g0 = data[1], b0 = data[2];
    const tol2 = tol * tol;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const dr = data[i] - r0, dg = data[i + 1] - g0, db = data[i + 2] - b0;
        mask[p] = (dr * dr + dg * dg + db * db) > tol2 ? 1 : 0;
    }
    if (ss > 1) { openMask(mask, width, height); closeMask(mask, width, height); }
    return mask;
}
function chamferDistance(mask: Uint8Array, w: number, h: number): Int32Array {
    const INF = 1e9;
    const dist = new Int32Array(w * h).fill(INF);
    for (let i = 0; i < dist.length; i++) if (mask[i]) dist[i] = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 3);
            if (y > 0) dist[i] = Math.min(dist[i], dist[i - w] + 3);
            if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - w - 1] + 4);
            if (x < w - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - w + 1] + 4);
        }
    }
    for (let y = h - 1; y >= 0; y--) {
        for (let x = w - 1; x >= 0; x--) {
            const i = y * w + x;
            if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 3);
            if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + 3);
            if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + 4);
            if (x > 0 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + 4);
        }
    }
    return dist;
}
function openMask(mask: Uint8Array, w: number, h: number) { erode(mask, w, h); dilate(mask, w, h); }
function closeMask(mask: Uint8Array, w: number, h: number) { dilate(mask, w, h); erode(mask, w, h); }
function erode(mask: Uint8Array, w: number, h: number) {
    const out = new Uint8Array(mask.length);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let ok = 1;
            for (let dy = -1; dy <= 1 && ok; dy++) {
                for (let dx = -1; dx <= 1 && ok; dx++) {
                    if (!mask[(y + dy) * w + (x + dx)]) ok = 0;
                }
            }
            if (ok) out[y * w + x] = 1;
        }
    }
    mask.set(out);
}
function dilate(mask: Uint8Array, w: number, h: number) {
    const out = new Uint8Array(mask.length);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let any = 0;
            for (let dy = -1; dy <= 1 && !any; dy++) {
                for (let dx = -1; dx <= 1 && !any; dx++) {
                    if (mask[(y + dy) * w + (x + dx)]) any = 1;
                }
            }
            if (any) out[y * w + x] = 1;
        }
    }
    mask.set(out);
}
function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
}
function hasAny(mask: Uint8Array) { return mask.some(Boolean); }