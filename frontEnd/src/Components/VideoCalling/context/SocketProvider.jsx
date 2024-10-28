import { createContext, useMemo, useContext } from "react"
import React from 'react'
import { io } from "socket.io-client"
const SocketContext = createContext(null);

export const useSocket = () =>{
    const socket = useContext(SocketContext);
    return socket; 
}
// http://192.168.0.118:5173/

export default function SocketProvider(props) {
    const socket = useMemo(() => io("http://localhost:8000"), []);

    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    )
}
