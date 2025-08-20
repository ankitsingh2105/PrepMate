import React from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import Room from '../VideoCalling/screens/Room'
import "./DSAScreen.css"
export default function DSAScreen() {
    let isLoggedIn = sessionStorage.getItem("isLoggedIn");
    console.log(isLoggedIn);
    console.log(typeof(isLoggedIn));
    return (
        <>
        {
            isLoggedIn !== "false" ? 
            <main className='DsaWindow' >
                <aside>
                    <CodeEditor />
                </aside>
                <aside>
                    <Room direction="column" roomWidth="250px" roomHeight="250px" />
                </aside>
            </main>
            :
            <center>
                <br />
                <b>
                    Please login first to use this service
                </b>
            </center>
        }
        </>
    )
}
