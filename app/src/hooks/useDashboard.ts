import { usePortalEndpoint, useResource } from './useResource';
export interface Dashboard {
    stats: {
        label: string;
        value: string;
        icon: string;
        tone: string;
    }[];
    patients: number;
    totalDoctors: number;
    totalAppointments: number;
    completion: number;
    utilization: number;
    trend: {
        month: string;
        appointments: number;
        revenue: number;
    }[];
    topTreatments: {
        name: string;
        percent: number;
    }[];
}
export function useDashboard(days = 30) { return useResource<Dashboard>(`${usePortalEndpoint()}/dashboard?days=${days}`, { stats: [], patients: 0, totalDoctors: 0, totalAppointments: 0, completion: 0, utilization: 0, trend: [], topTreatments: [] }); }
