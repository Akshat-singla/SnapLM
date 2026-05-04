import { createContext, useContext, useState } from "react";

type RobotState =
    | "idle"
    | "login"
    | "signup"
    | "typing-email"
    | "typing-password"
    | "success"
    | "error"
    | "forgot-password"
    | "otp"
    | "passkey"
    | "typing-name"
    | "user-exists"
    | "email-sent"
    | "reset-password";

const RobotContext = createContext<{
    state: RobotState;
    setState: (s: RobotState) => void;
}>({
    state: "idle",
    setState: () => { },
});

export const RobotProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<RobotState>("idle");

    return (
        <RobotContext.Provider value={{ state, setState }}>
            {children}
        </RobotContext.Provider>
    );
};

export const useRobot = () => useContext(RobotContext);