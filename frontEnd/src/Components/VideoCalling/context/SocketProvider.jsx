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
export const useSocketforChat = () => {
    const socketForChat = useContext(SocketContextForChat);
    return socketForChat;
}
// http://192.168.0.118:5173/

export default function SocketProvider(props) {
    const { backEndLink } = connectJs;
    const socket = useMemo(() => io(`${backEndLink}/interview`), []);
    const socketForChat = useMemo(() => io(`${backEndLink}/chat`), []);


    return (
        <SocketContext.Provider value={socket}>
            <SocketContextForChat.Provider value={socketForChat}>
                {props.children}
            </SocketContextForChat.Provider>
        </SocketContext.Provider>
    )
}
