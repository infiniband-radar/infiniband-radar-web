export interface ChangeOverviewDetails {
    added: number;
    modified: number;
    removed: number;
}

export interface ChangeOverview {
    timestamp: number;
    host: ChangeOverviewDetails;
    connection: ChangeOverviewDetails;
}
