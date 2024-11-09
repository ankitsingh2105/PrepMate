import React from 'react'
import  "./About.css";
export default function About() {
    return (
        <main className="mainAbout flex flex-col items-center justify-center">
            <div className=" aboutMainHeading text-center mb-12">
                <h1 className="text-4xl font-bold">
                    <span className="highlight">Practice</span> is like a partnership
                </h1>
                <h2 className="text-2xl font-bold">
                You can’t <span className="highlight">skip the grind</span> and expect to succeed
                </h2>
            </div>
            <div className="flex space-x-8">
                <div className="card">
                    <div className="card-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="card-title">Collaborate</div>
                    <div className="card-text">
                        Work together and achieve more with our collaborative tools and team-building exercises.
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">
                        <i className="fas fa-code"></i>
                    </div>
                    <div className="card-title">Code</div>
                    <div className="card-text">
                        Enhance your coding skills with our state-of-the-art programming resources and expert guidance.
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">
                        <i className="fas fa-video"></i>
                    </div>
                    <div className="card-title">Video Call</div>
                    <div className="card-text">
                        Connect with others through our high-quality video call services and virtual meeting platforms.
                    </div>
                </div>
            </div>
        </main>
    );
}
