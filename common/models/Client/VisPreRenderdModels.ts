export interface VisPreRenderedColors {
    [connectionId: string]: {
        portA: string, // CSS Color code
        portB: string, // CSS Color code
    };
}

export interface VisPreRenderedPositions {
    [nodeId: string]: {
        x: number,
        y: number,
    };
}
