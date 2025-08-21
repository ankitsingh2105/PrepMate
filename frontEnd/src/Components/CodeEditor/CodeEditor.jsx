import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Monaco from "@monaco-editor/react";
import { useLocation } from "react-router-dom";
import { useSocketforCode } from "../../Components/VideoCalling/context/SocketProvider";
import { toast } from "react-toastify";

function CodeEditor() {
  const socket = useSocketforCode();
  const path = useLocation().pathname;
  const room = path.split("/")[3];
  const lastSentCode = useRef("");

  const [sourceCode, setSourceCode] = useState("// code here\n\n");
  const [compilerID, setLanguageId] = useState("52");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const yourSocketId = useRef(null);

  const toBase64 = (str) => window.btoa(unescape(encodeURIComponent(str)));

  const handleEditorChange = (value) => {
    setSourceCode(value);
    lastSentCode.current = value;
    socket.emit("user:codeChange", {
      room,
      sourceCode: value,
      socketId: yourSocketId.current,
    });
  };

  const getResult = async () => {
    toast.info("Please wait for the result",  {autoClose:100});
    const encodedSourceCode = toBase64(sourceCode);
    const encodedInput = input ? toBase64(input) : "";
    let token;
    try {
      let response = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions",
        {
          language_id: compilerID,
          source_code: encodedSourceCode,
          stdin: encodedInput,
        },
        {
          params: { base64_encoded: "true", wait: "false", fields: "*" },
          headers: {
            "x-rapidapi-key":
              "76289c78bbmsh0e35bfabb04cff4p1a92c0jsnae7e4fb869f3",
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "Content-Type": "application/json",
          },
        }
      );
      token = response.data.token;
      toast.info("Just a second", { autoClose: 200 });
    } catch (err) {
      setError("Error submitting code");
      toast.error("Submission failed", { autoClose: 500 });
      return;
    }
    if (!token) {
      return;
    }
    try {
      const response = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          params: { base64_encoded: "true", fields: "*" },
          headers: {
            "x-rapidapi-key":
              "76289c78bbmsh0e35bfabb04cff4p1a92c0jsnae7e4fb869f3",
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          },
        }
      );
      const decodedOutput = atob(response.data.stdout || "");
      if (!decodedOutput.trim()) {
        toast.error("Syntax error / wrong language");
        return;
      }
      setResult(decodedOutput);
      socket.emit("getOutput", { decodedOutput, room });
      setError("");
      toast.success("Please check output", { autoClose: 400 });
    } catch (err) {
      console.error(err);
      setError("Error fetching result");
    }
  };

  const handleIncomingCode = (e) => {
    console.log(e.senderSocketId, " +++++ ", yourSocketId.current);
    if (
      e.sourceCode !== lastSentCode.current &&
      yourSocketId.current != e.senderSocketId
    ) {
      setSourceCode(e.sourceCode);
    }
  };

  const handleIncomingOutput = ({ decodedOutput }) => {
    setResult(decodedOutput);
  };

  useEffect(() => {
    if (!socket) return;

    const join = () => {
      console.log("✅ Joining room:", room, "with id:", socket.id);
      if (!yourSocketId.current) {
        yourSocketId.current = socket.id;
      }
      socket.emit("joinRoom", room);
    };

    if (socket.connected) {
      join();
    } else {
      socket.on("connect", join);
    }

    return () => {
      socket.off("connect", join); 
    };
  }, [socket, room]);

  useEffect(() => {
    socket.on("user:codeChangeAccepted", handleIncomingCode);
    socket.on("getOutput", handleIncomingOutput);
    return () => {
      socket.off("user:codeChangeAccepted", handleIncomingCode);
      socket.off("getOutput");
    };
  }, [socket]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="mb-4">
        <select
          className="p-1 bg-orange-500 font-bold text-white rounded shadow"
          value={compilerID}
          onChange={(e) => setLanguageId(e.target.value)}
        >
          <option value="52">C++</option>
          <option value="63">JavaScript</option>
          <option value="62">Java</option>
          <option value="71">Python</option>
        </select>
      </div>

      <div className="shadow-lg rounded border overflow-hidden mb-4 bg-purple-200">
        <Monaco
          height="300px"
          width="800px"
          defaultLanguage="cpp"
          value={sourceCode}
          onChange={handleEditorChange}
          options={{
            theme: "vs-light",
            fontSize: 14,
            lineNumbers: "on",
            wordWrap: "on",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            formatOnType: true,
            tabSize: 4,
          }}
        />
      </div>

      <textarea
        className="w-full p-3 rounded shadow-sm mb-4 bg-purple-200"
        placeholder="Enter input here"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={2}
      />

      <div className="flex gap-4 mb-4">
        <button
          className="bg-green-500 font-bold text-white px-4 py-2 rounded hover:bg-green-700 transition"
          onClick={getResult}
        >
          Get Result
        </button>
      </div>

      <div className="bg-purple-200 p-4 rounded shadow-sm">
        <h3 className="font-semibold mb-2 text-lg">Output</h3>
        <pre className="whitespace-pre-wrap">{result}</pre>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default CodeEditor;
