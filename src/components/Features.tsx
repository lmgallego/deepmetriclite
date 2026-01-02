import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Activity, Zap, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: <BarChart2 className="w-8 h-8 text-netflix-red" />,
    title: "Power Curve Analysis",
    description: "Deep dive into your critical power and anaerobic work capacity with precision."
  },
  {
    icon: <Activity className="w-8 h-8 text-netflix-red" />,
    title: "Fatigue Monitoring",
    description: "Track your chronic training load and fatigue to avoid burnout and optimize form."
  },
  {
    icon: <Zap className="w-8 h-8 text-netflix-red" />,
    title: "Interval Detection",
    description: "Automated detection and classification of your intervals for cleaner data."
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-netflix-red" />,
    title: "Progress Tracking",
    description: "Visualize your improvements over time with our intuitive dashboard."
  }
];

const Features = () => {
  return (
    <div className="py-20 bg-netflix-black relative z-20">
      <div className="container mx-auto px-4 md:px-12">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center md:text-left">
          Powerful Metrics. <span className="text-gray-500">Zero Cost.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#181818] hover:bg-[#202020] p-6 rounded-md transition duration-300 group cursor-pointer border border-transparent hover:border-gray-700"
            >
              <div className="mb-4 transform group-hover:scale-110 transition duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
