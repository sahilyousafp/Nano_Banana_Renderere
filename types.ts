export enum NodeType {
  INPUT = 'INPUT',
  PROCESSOR = 'PROCESSOR',
  OUTPUT = 'OUTPUT'
}

export interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number; // Optional, defaults to standard size if missing
  height?: number;
  title: string;
  data: {
    outputImage?: string;
    [key: string]: any;
  };
}

export interface Connection {
  id: string;
  from: string; // Node ID (Source)
  to: string;   // Node ID (Target)
}

export enum RenderPreset {
  DEFAULT = 'Default',
  ARCH_VIZ = 'Architecture Visualization',
  INTERIOR = 'Interior Design',
  EXHIBITION = 'Exhibition Design',
  PRODUCT = 'Product Studio',
  LUMION_REALISTIC = 'Lumion Realistic'
}

export interface GeminiStats {
  timestamp: number;
  tokens: number;
  latency: number;
}