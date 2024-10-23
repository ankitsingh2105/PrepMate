import React from 'react'
import { useNavigate } from 'react-router-dom';
import homeImage from "./homeImage.png"
export default function Home() {
    const navigate = useNavigate();
    return (
        <div>
            <nav class="flex items-center justify-between p-4 border-b">
                <div class="flex items-center space-x-2">
                    <div class="bg-purple-600 text-white p-2 rounded">
                        <i class="fas fa-star"></i>
                    </div>
                    <span class="text-xl font-bold">PrepMate</span>
                </div>
                <section className='flex items-center justify-center space-x-4'>
                    <button onClick={()=>{navigate("/login")}} className=''>
                        Login
                    </button>
                    <button onClick={()=>{navigate("/signup")}} className='bg-purple-600 text-white px-3 py-1 rounded'>
                        Sign Up
                    </button>
                </section>
            </nav>


            <main class="flex justify-center align-center mt-12 p-8">
                <div class="max-w-lg">
                    <h1 class="text-6xl font-bold text-gray-900">Practice mock interviews with peers</h1>
                    <p class="text-gray-700 mt-10">Join like minded candidates practicing interviews to land jobs. Practice real questions over video chat in a collaborative environment.</p>
                    <div class="mt-6 flex items-center space-x-4">
                        <button class="bg-purple-600 text-white px-4 py-2 rounded">Schedule practice session</button>
                        <div>
                            <p class="text-gray-700">5 credits remaining</p>
                            <a href="#" class="text-purple-600">Get unlimited sessions</a>
                        </div>
                    </div>
                </div>
                <div>
                    <img src={homeImage} style={{width : "400px", height : "400px"}} alt="perons taking mock interview"/>
                </div>
            </main>
        </div>
    );
}
