import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Logo from '../components/common/Logo';
import backgroundImage from '../assets/homepage.png';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQsPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "How does the player analysis system work?",
      answer: "Our player analysis system uses advanced algorithms to evaluate players based on multiple parameters including performance statistics, physical attributes, and historical data. We process this data to provide comprehensive insights that help in making informed recruitment decisions."
    },
    {
      question: "What metrics are used to compare players?",
      answer: "We analyze various metrics including technical skills (passing accuracy, shot precision, tackle success rate), physical attributes (speed, stamina, strength), tactical understanding, and consistency in performance. The system also considers league-specific factors and opposition quality for a more accurate comparison."
    },
    {
      question: "How often is player data updated?",
      answer: "Player data is updated after every match to ensure you have access to the most recent performance metrics. Historical data is maintained to track player development and identify trends in performance over time."
    },
    {
      question: "Can I create custom analysis parameters?",
      answer: "Yes, our platform allows you to create custom parameters and weightages for player analysis. This helps you focus on specific attributes that are most important for your team's requirements and playing style."
    },
    {
      question: "How do you ensure data accuracy?",
      answer: "We source our data from multiple reliable providers and cross-validate it for accuracy. Our system also employs validation algorithms to flag any anomalies in the data, ensuring you get accurate and reliable insights."
    },
    {
      question: "What reports are available for player analysis?",
      answer: "We offer various report types including detailed individual player reports, comparative analysis reports, team composition analysis, and performance trend reports. These can be customized and exported in different formats."
    },
    {
      question: "Is historical performance data available?",
      answer: "Yes, we maintain comprehensive historical data for all players. This includes match-by-match statistics, season averages, and year-on-year progression, helping you understand a player's development trajectory."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link 
              to="/home" 
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors duration-200 mr-6"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </Link>
            <Logo size="md" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div 
        className="relative py-16 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url(${backgroundImage})`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Find answers to common questions about our player recruitment and analysis platform
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-750 transition-colors duration-200"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-lg font-medium text-white">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="text-gray-400 w-5 h-5 flex-shrink-0" />
                ) : (
                  <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-750 border-t border-gray-700">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-300">
            Still have questions? Feel free to{' '}
            <a 
              href="mailto:khuzemaasim123@gmail.com"
              className="text-primary-500 hover:text-primary-400 transition-colors duration-200"
            >
              contact us
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default FAQsPage; 