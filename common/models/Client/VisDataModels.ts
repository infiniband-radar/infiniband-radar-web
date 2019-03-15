type VisNodeId = string;
type VisEdgeId = string;

export interface VisNode {
    id: VisNodeId;
    shape: 'circle' | 'box';
    label: string;
}

export interface VisEdge {
    id: VisEdgeId;
    from: VisNodeId;
    to: VisNodeId;
}

export interface VisDataModel {
    nodes: VisNode[];
    edges: VisEdge[];
}
