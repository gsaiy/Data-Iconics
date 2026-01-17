// Set this to true to force simulation and stop all external API calls for Weather/Flood
export const FORCE_SIMULATION = false;

interface ServiceStatus {
    isDisabled: boolean;
    lastError?: number;
    errorMessage?: string;
}

// Persist disabled state to localStorage to avoid even the FIRST 403/429 error on reload
const getInitialStatus = (service: string): ServiceStatus => {
    if (FORCE_SIMULATION) return { isDisabled: true };
    const saved = localStorage.getItem(`service_disabled_${service}`);
    const savedError = localStorage.getItem(`service_error_${service}`);
    return {
        isDisabled: saved === 'true',
        errorMessage: savedError || undefined
    };
};

const serviceStatus: Record<string, ServiceStatus> = {
    openWeather: getInitialStatus('openWeather'),
    tomtom: getInitialStatus('tomtom'),
    meteosource: getInitialStatus('meteosource'),
    meteostat: getInitialStatus('meteostat'),
};

export const isServiceDisabled = (service: keyof typeof serviceStatus) => {
    const disabled = serviceStatus[service].isDisabled || FORCE_SIMULATION;
    if (disabled) console.log(`Service ${service} is currently disabled.`);
    return disabled;
};

export const getServiceError = (service: keyof typeof serviceStatus) => {
    return serviceStatus[service].errorMessage;
};

export const disableService = (service: keyof typeof serviceStatus, message?: string) => {
    if (!serviceStatus[service].isDisabled) {
        console.warn(`Circuit Breaker: Persisting disable for ${service} API. Error: ${message}`);
        serviceStatus[service].isDisabled = true;
        serviceStatus[service].errorMessage = message;
        localStorage.setItem(`service_disabled_${service}`, 'true');
        if (message) localStorage.setItem(`service_error_${service}`, message);
    }
};

export const resetServices = () => {
    Object.keys(serviceStatus).forEach(key => {
        serviceStatus[key].isDisabled = false;
        serviceStatus[key].errorMessage = undefined;
        localStorage.removeItem(`service_disabled_${key}`);
        localStorage.removeItem(`service_error_${key}`);
    });
};
