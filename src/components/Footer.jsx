import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer-container">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <h2>B-WAMS</h2>
                        <p>Bengaluru Waste Management & Analytics System</p>
                    </div>
                    
                    <div className="footer-links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/#features">Features</a></li>
                            <li><Link to="/login">Dashboard</Link></li>
                            <li><a href="/#technology">Technology</a></li>
                            <li><a href="/#contact">Contact</a></li>
                        </ul>
                    </div>

                    <div className="footer-contact" id="contact">
                        <h3>Contact</h3>
                        <ul>
                            <li><a href="mailto:support@bwams.in">support@bwams.in</a></li>
                            <li>Bengaluru, Karnataka, India</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="footer-copyright">
                <p>&copy; 2026 B-WAMS. All rights reserved.</p>
            </div>
        </footer>
    );
}
