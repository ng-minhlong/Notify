"use client";

import React, { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface MindmapViewerProps {
  data: string; // JSON string of mindmap data
}

interface MindmapNode {
  id: string;
  label: string;
  children?: MindmapNode[];
}

/**
 * Convert hierarchical mindmap data to React Flow nodes and edges
 */
function parseMindmapData(jsonString: string): { nodes: Node[]; edges: Edge[] } {
  try {
    const data = JSON.parse(jsonString) as MindmapNode;
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeCount = 0;

    const traverse = (item: MindmapNode, parentId: string | null = null, level: number = 0) => {
      const nodeId = `node-${nodeCount++}`;
      
      nodes.push({
        id: nodeId,
        data: { label: item.label },
        position: { x: level * 250, y: nodeCount * 100 },
        style: {
          background: "#fff",
          border: "2px solid #222",
          borderRadius: "8px",
          padding: "10px 15px",
          fontSize: "12px",
          fontWeight: level === 0 ? "bold" : "normal",
        },
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          animated: true,
        });
      }

      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => {
          traverse(child, nodeId, level + 1);
        });
      }
    };

    traverse(data);
    return { nodes, edges };
  } catch (error) {
    console.error("Failed to parse mindmap data:", error);
    return { nodes: [], edges: [] };
  }
}

export function MindmapViewer({ data }: MindmapViewerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => parseMindmapData(data),
    [data]
  );

  const [nodes, _setNodes] = useNodesState(initialNodes);
  const [edges, _setEdges] = useEdgesState(initialEdges);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
