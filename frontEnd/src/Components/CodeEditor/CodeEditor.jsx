import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Monaco from '@monaco-editor/react';
import "./editor.css"
import { useLocation } from "react-router-dom"
import { useSocketforChat } from '../../Components/VideoCalling/context/SocketProvider';
import { toast } from 'react-toastify';

function CodeEditor() {

    const socket = useSocketforChat();
    let path = useLocation();
    path = path.pathname;
    const room = path.split("/")[2];
    console.log("room is :: ", room);


    // todo :: chatting handled
    const lastSentCode = useRef('');  // * i need to track if the code is changed

    const handleIncomingCode = (code) => {
        if (code.sourceCode !== lastSentCode.current) { // Update only if different
            console.log("Received code update:", code.sourceCode);
            setSourceCode(code.sourceCode);
        }
    };

    useEffect(() => {
        socket.emit("joinRoom", room);
    }, [socket])


    useEffect(() => {
        socket.on("user:codeChangeAccepted", handleIncomingCode);
        return () => {
            socket.off("user:codeChangeAccepted", handleIncomingCode)
        }
    }, [socket, handleIncomingCode])

    const handleEditorChange = (value) => {
        setSourceCode(value);
        lastSentCode.current = value;
        socket.emit("user:codeChange", { room, sourceCode: value });
    };

    const [sourceCode, setSourceCode] = useState(`//code here
        












    `);
    const [compilerID, setLanguageId] = useState('52'); // C++ G++ ID
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    // Base64 encoding function
    const toBase64 = (str) => {
        return window.btoa(unescape(encodeURIComponent(str)));
    }

    const submitCode = async () => {
        const encodedSourceCode = toBase64(sourceCode);
        console.log("souurce code is :: " , sourceCode);
        const encodedInput = input ? toBase64(input) : '';

        const options = {
            method: 'POST',
            url: 'https://judge0-ce.p.rapidapi.com/submissions',
            params: {
                base64_encoded: 'true',
                wait: 'false',
                fields: '*'
            },
            headers: {
                'x-rapidapi-key': '76289c78bbmsh0e35bfabb04cff4p1a92c0jsnae7e4fb869f3',
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            data: {
                language_id: compilerID,
                source_code: encodedSourceCode,
                stdin: encodedInput
            }
        };

        try {
            const response = await axios.request(options);
            console.log("Token received:", response.data.token);
            setToken(response.data.token);
        } catch (err) {
            console.error(err);
            setError("Error submitting code");
        }

        console.log("Fetching result for token:", token);
        if (!token) {
            setError("Please try again");
            toast.error("Something went wrong");
            return;
        }
        toast.success("Code Submitted, tap on  Get result");

    }

    const getResult = async () => {
        console.log("Fetching result for token:", token);
        if (!token) {
            setError("No token available. Please submit the code first.");
            return;
        }

        const options = {
            method: 'GET',
            url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
            params: {
                base64_encoded: 'true',
                fields: '*'
            },
            headers: {
                'x-rapidapi-key': '76289c78bbmsh0e35bfabb04cff4p1a92c0jsnae7e4fb869f3',
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(options);
            const decodedOutput = atob(response.data.stdout || '');
            if(decodedOutput.length==0){
                toast.error("Error in code");
                return;
            }
            console.log("Execution result:", decodedOutput);
            setResult(decodedOutput);
            setError('');
        } catch (err) {
            console.error(err);
            setError("Error fetching result");
        }
    }

    return (
        <div className='mainDiv' >
            <select
                value={compilerID}
                onChange={(e) => setLanguageId(e.target.value)}
            >
                <option value="52">C++</option>
                <option value="62">Java</option>
                <option value="63">JavaScript</option>
                <option value="71">Python</option>
            </select>
            <br />
            <main className='editor' >
                <Monaco
                    height="250px"
                    width="800px"
                    defaultLanguage="cpp"
                    value={sourceCode}
                    onChange={handleEditorChange}
                    options={{
                        theme: 'vs-light',
                        fontSize: 13,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        formatOnType: true,
                        tabSize: 4,
                    }}
                />
            </main>

            <textarea
                placeholder="Enter the input here"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows="4"
                cols="50"
            />
            <br />
            <button onClick={submitCode}>Submit</button>
            &nbsp;
            <button onClick={getResult}>Get Result</button>
            <div className='finalResult' >
                <b>Output</b>
                <pre>{result}</pre>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    );
}

export default CodeEditor;
