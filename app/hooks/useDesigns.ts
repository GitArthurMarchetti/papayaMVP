import { useState, ChangeEvent, MouseEvent } from 'react';
import { Design, DesignConfig } from '../types';

export const useDesigns = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const activeDesign = activeIndex > -1 ? designs[activeIndex] : null;

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
        material: 'Vinyl',
        finish: 'Glossy',
        quantity: 50,
        width: 10,
        height: 10, 
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

  return {
    designs,
    activeIndex,
    setActiveIndex,
    activeDesign,
    handleFileChange,
    handleDelete,
    handleConfigChange,
  };
};