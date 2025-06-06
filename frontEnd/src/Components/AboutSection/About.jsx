

export default function About() {
    return (
        <main className="bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-4 text-gray-800">
                        <span className="text-purple-600 relative inline-block">
                            Practice
                            <span className="absolute bottom-0 left-0 w-full h-2 bg-purple-200 -z-10 transform -rotate-1"></span>
                        </span> is like a partnership
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-700 mt-4">
                        You can't <span className="text-purple-600 relative inline-block">
                            skip the grind
                            <span className="absolute bottom-0 left-0 w-full h-2 bg-purple-200 -z-10"></span>
                        </span> and expect to succeed
                    </h2>
                    <div className="w-24 h-1 bg-purple-500 mx-auto mt-8"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                        <div className="bg-purple-600 text-white p-6 flex justify-center">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Collaborate</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Work together and achieve more with our collaborative tools and team-building exercises. Build connections that last beyond interviews.
                            </p>
                            <div className="mt-6">
                                <a href="#" className="text-purple-600 font-medium flex items-center">
                                    Learn more
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                        <div className="bg-indigo-600 text-white p-6 flex justify-center">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                            </svg>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Code</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Enhance your coding skills with our state-of-the-art programming resources and expert guidance from industry professionals.
                            </p>
                            <div className="mt-6">
                                <a href="#" className="text-indigo-600 font-medium flex items-center">
                                    Learn more
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                        <div className="bg-pink-600 text-white p-6 flex justify-center">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Video Call</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Connect with others through our high-quality video call services and virtual meeting platforms designed for seamless interaction.
                            </p>
                            <div className="mt-6">
                                <a href="#" className="text-pink-600 font-medium flex items-center">
                                    Learn more
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Join thousands of professionals who have accelerated their career growth through our structured practice sessions and supportive community.
                    </p>
                    <button className="mt-8 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        Start Your Journey
                    </button>
                </div>
            </div>
        </main>
    );
}
