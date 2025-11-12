"use client";
import { createContext, useContext, ReactNode } from "react";

export interface User {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    createdAt: string;
}

const UserContext = createContext<User | null>(null);

export const UserProvider = ({ user, children }: { user: User; children: ReactNode }) => {
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within UserProvider");
    return context;
};
