export interface ClientConfig {
    // Map
    enableMapPhysicsSimulation: boolean;
    showConnectionColorsAsLinkType: boolean;

    // SideBar
    showHostCaGuidsInSearchList: boolean;
    alwaysDisplayCaDescriptionInPortList: boolean;
    alwaysDisplayHostCaDescOnButtons: boolean;
    autoZoomOutOnBackToSearch: boolean;

    // Metrics
    scaleMetricAlwaysToMax: boolean;
    allowTimeRangeSelectionInGlobalMetric: boolean;
    allowTimeRangeSelectionInMetric: boolean;
    selectConnectionInDiagramWhenClicked: boolean;

    // Global Metric
    displayGlobalMetric: boolean;
    highlightSeriesWhenHoverOverIt: boolean;

    // Changes
    showChangeOverlayTutorial: boolean;
}

export const defaultClientConfig: Readonly<ClientConfig> = {
    // Map
    enableMapPhysicsSimulation: false,
    showConnectionColorsAsLinkType: false,

    // SideBar
    showHostCaGuidsInSearchList: false,
    alwaysDisplayCaDescriptionInPortList: true,
    alwaysDisplayHostCaDescOnButtons: false,
    autoZoomOutOnBackToSearch: true,

    // Metrics
    scaleMetricAlwaysToMax: false,
    allowTimeRangeSelectionInGlobalMetric: false,
    allowTimeRangeSelectionInMetric: true,
    selectConnectionInDiagramWhenClicked: true,

    // Global Metric
    displayGlobalMetric: true,
    highlightSeriesWhenHoverOverIt: true,

    // Changes
    showChangeOverlayTutorial: true,
};
