import { createContext, useMemo, useContext } from "react"
import React from 'react'
import { io } from "socket.io-client"
const SocketContextForChat = createContext(null);
import connectJs from "../../../connect";

export const useSocketforCode = () => {
    const socketForCode = useContext(SocketContextForChat);
    return socketForCode;
}
// http://192.168.0.118:5173/

export default function SocketProvider(props) {
    const { backEndLink } = connectJs;
    const socketForCode = useMemo(() => io(`${backEndLink}/code-edit`, {
        withCredentials: true,
        transports: ["websocket", "polling"]
    }), [backEndLink]);

    return (
        <SocketContextForChat.Provider value={socketForCode}>
            {props.children}
        </SocketContextForChat.Provider>
    )
}
