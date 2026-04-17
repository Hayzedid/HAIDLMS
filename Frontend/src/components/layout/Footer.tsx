import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TechLearn</span>
            </div>
            <p className="text-sm text-gray-400">
              Empowering tech professionals with cutting-edge courses, AI-powered learning, and real-world projects.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@techlearn.com"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Learn Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Learn</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-sm hover:text-white transition-colors">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/playground" className="text-sm hover:text-white transition-colors">
                  Code Playground
                </Link>
              </li>
              <li>
                <Link to="/ai-tutor" className="text-sm hover:text-white transition-colors">
                  AI Tutor
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-sm hover:text-white transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/accessibility" className="text-sm hover:text-white transition-colors">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} TechLearn. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/sitemap" className="hover:text-white transition-colors">
                Sitemap
              </Link>
              <Link to="/help" className="hover:text-white transition-colors">
                Help Center
              </Link>
              <Link to="/status" className="hover:text-white transition-colors">
                System Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
