import React from "react";
import {FaFacebook, FaGithub, FaLinkedin} from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 text-gray-700 mt-10 shadow-inner">
            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">

                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Prime Build</h2>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        Ensure every component works together flawlessly. Compare parts, check compatibility,
                        analyze pricing trends, and build your PC with confidence.
                    </p>
                </div>

                <div></div>

                <div className="md:justify-self-end text-left md:text-right">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Connect
                    </h3>
                    <p className="text-sm text-gray-600">
                        Email: primebuildemail@gmail.com
                    </p>

                    <div className="flex md:justify-end space-x-4 mt-4 text-xl">
                        <a href="#" className="hover:text-gray-900 transition duration-200">
                            <FaFacebook/>
                        </a>
                        <a
                            href="https://github.com/chama951"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-900 transition duration-200"
                        >
                            <FaGithub/>
                        </a>
                        <a href="#" className="hover:text-gray-900 transition duration-200">
                            <FaLinkedin/>
                        </a>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 text-center py-4 text-sm text-gray-500">
                © {new Date().getFullYear()} Prime Build. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;