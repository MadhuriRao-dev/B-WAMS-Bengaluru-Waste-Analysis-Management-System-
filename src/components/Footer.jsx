import React from 'react';

export default function Footer() {
    return (
        <footer className="footer-container">
            {/* Stats Section */}
            <div className="footer-stats">
                <div className="stat-item">
                    <h3 className="stat-number">500+</h3>
                    <p className="stat-label">Complaints Solved</p>
                </div>
                <div className="stat-item">
                    <h3 className="stat-number">100+</h3>
                    <p className="stat-label">Active Volunteers</p>
                </div>
                <div className="stat-item">
                    <h3 className="stat-number">50+</h3>
                    <p className="stat-label">Areas Covered</p>
                </div>
                <div className="stat-item">
                    <h3 className="stat-number">24hr</h3>
                    <p className="stat-label">Avg Response</p>
                </div>
            </div>

            {/* Copyright Section */}
            <div className="footer-copyright">
                <p>&copy; {new Date().getFullYear()} B-WAMS (Bengaluru Waste Analytics & Management System). All rights reserved.</p>
            </div>
        </footer >
    );
}
