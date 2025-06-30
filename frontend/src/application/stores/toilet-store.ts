import React, { createContext, useContext, useState, ReactNode } from "react";
import { Toilet, Location } from "@/domain/entities/toilet";

interface ToiletState {
    toilets: Toilet[];
    currentLocation: Location | null;
    isLoading: boolean;
    error: string | null;
    selectedToilet: Toilet | null;
}

interface ToiletActions {
    setToilets: (toilets: Toilet[]) => void;
    setCurrentLocation: (location: Location) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSelectedToilet: (toilet: Toilet | null) => void;
    clearToilets: () => void;
}

type ToiletContextType = ToiletState & ToiletActions;

const ToiletContext = createContext<ToiletContextType | undefined>(undefined);

interface ToiletProviderProps {
    children: ReactNode;
}

export const ToiletProvider: React.FC<ToiletProviderProps> = ({ children }) => {
    const [toilets, setToilets] = useState<Toilet[]>([]);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(
        null
    );
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

    const clearToilets = () => {
        setToilets([]);
        setSelectedToilet(null);
    };

    const value: ToiletContextType = {
        toilets,
        currentLocation,
        isLoading,
        error,
        selectedToilet,
        setToilets,
        setCurrentLocation,
        setLoading,
        setError,
        setSelectedToilet,
        clearToilets,
    };

    return (
        <ToiletContext.Provider value={value}>
            {children}
        </ToiletContext.Provider>
    );
};

export const useToiletStore = (): ToiletContextType => {
    const context = useContext(ToiletContext);
    if (context === undefined) {
        throw new Error("useToiletStore must be used within a ToiletProvider");
    }
    return context;
};
