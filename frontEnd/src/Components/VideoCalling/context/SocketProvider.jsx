import { createContext, useMemo, useContext } from "react"
import React from 'react'
import { io } from "socket.io-client"
const SocketContext = createContext(null);
const SocketContextForChat = createContext(null);
import connectJs from "../../../connect";

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
}
export const useSocketforCode = () => {
    const socketForCode = useContext(SocketContextForChat);
    return socketForCode;
}
// http://192.168.0.118:5173/

export default function SocketProvider(props) {
    const { backEndLink } = connectJs;
    const socket = useMemo(() => io(`${backEndLink}/interview`, {
        withCredentials: true,
        transports: ["websocket", "polling"]
    }), [backEndLink]);
    const socketForCode = useMemo(() => io(`${backEndLink}/code-edit`, {
        withCredentials: true,
        transports: ["websocket", "polling"]
    }), [backEndLink]);

    return (
        <SocketContext.Provider value={socket}>
            <SocketContextForChat.Provider value={socketForCode}>
                {props.children}
            </SocketContextForChat.Provider>
        </SocketContext.Provider>
    )
}
