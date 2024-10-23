import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import connectJs from "../../connect";
import axios from "axios";

const Login = () => {

    const { backEndLink } = connectJs;
    const [userName, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();
    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            let response = await axios.post(`${backEndLink}/login` , {
                userName , password
            })
            console.log(response);
        }
        catch(error){
            console.log("error" , error);
        }
        console.log({ userName, password });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-purple-600">Login</h2>
                <div className="mb-4">
                    <label className="block text-gray-700">Username</label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    />
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded">
                    Login
                </button>
                <div className='flex items-center justify-center mt-4'>
                    New user ? Sign Up here
                </div>
                <button onClick={() => { navigate("/signup") }} className="mt-4 w-full bg-purple-600 text-white p-2 rounded">
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Login;