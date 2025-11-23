import React, { memo, useCallback, useMemo } from 'react';
import { Node } from './Node';
import { InputNodeContent } from './InputNodeContent';
import { EditNodeContent } from './EditNodeContent';
import { OutputNodeContent } from './OutputNodeContent';
import { NodeData, NodeType } from '../types';

interface SmartNodeProps {
  node: NodeData;
  isSelected: boolean;
  scale: number;
  inputImage: string | null;
  isProcessing: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  onConnectStart: (nodeId: string, handleType: 'source' | 'target', e: React.MouseEvent) => void;
  onConnectEnd: (nodeId: string, handleType: 'source' | 'target') => void;
  onImageUpload: (id: string, base64: string) => void;
  onPreview: (image: string) => void;
  onGenerate: (id: string, prompt: string, maskData: string | null, settings: any) => void;
}

export const SmartNode: React.FC<SmartNodeProps> = memo(({
  node,
  isSelected,
  scale,
  inputImage,
  isProcessing,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onConnectStart,
  onConnectEnd,
  onImageUpload,
  onPreview,
  onGenerate
}) => {
  
  // Create stable handlers for children to prevent their re-renders
  const handleImageUpload = useCallback((base64: string) => {
    onImageUpload(node.id, base64);
  }, [onImageUpload, node.id]);

  const handleGenerate = useCallback((prompt: string, maskData: string | null, settings: any) => {
    onGenerate(node.id, prompt, maskData, settings);
  }, [onGenerate, node.id]);

  const content = useMemo(() => {
    switch (node.type) {
      case NodeType.INPUT:
        return (
          <InputNodeContent 
            image={node.data.outputImage || null} 
            onImageUpload={handleImageUpload}
            onPreview={onPreview}
          />
        );
      case NodeType.PROCESSOR:
        return (
          <EditNodeContent 
            inputImage={inputImage}
            onGenerate={handleGenerate}
            isGenerating={isProcessing}
            onPreview={onPreview}
          />
        );
      case NodeType.OUTPUT:
        return (
          <OutputNodeContent 
            image={inputImage}
            onPreview={onPreview}
          />
        );
      default:
        return null;
    }
  }, [node.type, node.data.outputImage, inputImage, isProcessing, handleImageUpload, handleGenerate, onPreview]);

  return (
    <Node
      data={node}
      scale={scale}
      isSelected={isSelected}
      onSelect={onSelect}
      onMove={onMove}
      onResize={onResize}
      onDelete={onDelete}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
    >
      {content}
    </Node>
  );
}, (prev, next) => {
  // Custom comparison to really lock down unnecessary renders
  return (
    prev.node === next.node && // Node data reference check (fast)
    prev.isSelected === next.isSelected &&
    prev.scale === next.scale &&
    prev.inputImage === next.inputImage &&
    prev.isProcessing === next.isProcessing
  );
});