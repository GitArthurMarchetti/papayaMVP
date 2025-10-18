'use client';

import PreviewCanvas from "./components/canvas/PreviewCanvas";
import ConfigPanel from "./components/config-panel/ConfigPanel";
import DesignSidebar from "./components/DesignSideBar";
import Header from "./components/Header";
import { useDesigns } from "./hooks/useDesigns";

export default function StickerProofPage() {
  const {
    designs,
    activeIndex,
    setActiveIndex,
    activeDesign,
    handleFileChange,
    handleDelete,
    handleConfigChange,
  } = useDesigns();

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-100 font-sans">
      <Header />
      <div className="flex h-[92%] w-full flex-row">
        <DesignSidebar
          designs={designs}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          handleFileChange={handleFileChange}
          handleDelete={handleDelete}
        />
        
        <section className="h-full w-10/12">
          <PreviewCanvas designs={designs} activeDesign={activeDesign} />
          <ConfigPanel activeDesign={activeDesign} handleConfigChange={handleConfigChange} />
        </section>
      </div>
    </div>
  );
}