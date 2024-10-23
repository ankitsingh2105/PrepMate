import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import links from "../../connect";
const Signup = () => {
    const { backEndLink } = links;
    const [email, setEmail] = useState('');
    const [userName, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response = await axios.post(`${backEndLink}/signup`, {
                email, userName, password
            }, { withCredentials: true });

            console.log("resposne is :: ", response);
            navigate("/");
        }
        catch (error) {
            console.log("error", error);
        }
        console.log({ email, userName, password });
        console.log({ email, userName, password });
    };


    return (
        <div className="flex items-center p-8 justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-purple-600">Sign Up</h2>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Username</label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring focus:ring-purple-600 focus:outline-none"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring focus:ring-purple-600 focus:outline-none"
                    />
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                    Sign Up
                </button>
                <div className='flex items-center justify-center mt-4'>
                    Already a user ? login here
                </div>
                <button onClick={() => { navigate("/login") }} className="mt-4 w-full bg-purple-600 text-white p-2 rounded">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Signup;