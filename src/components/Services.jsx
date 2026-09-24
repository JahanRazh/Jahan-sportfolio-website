'use client';

import React from 'react';
import { Code2, Smartphone, LayoutDashboard } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: Code2,
      title: 'Web Development',
      description:
        "I'm a static and dynamic web developer with a knack for turning ideas into interactive online experiences. Proficient in MERN Stack, HTML, PHP, CSS, and JavaScript, I bring websites to life with sleek designs and smooth functionality. My goal is to create user-friendly, visually appealing web solutions that leave a lasting impression. Let's build the web together!",
      accent: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Smartphone,
      title: 'Mobile App Development',
      description:
        "I'm a mobile app developer with a passion for crafting dynamic and user-friendly applications. Proficient in Flutter framework, I specialize in creating cross-platform apps that seamlessly run on Android. From concept to deployment, I'm dedicated to delivering innovative mobile solutions that captivate users and solve real-world problems.",
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      icon: LayoutDashboard,
      title: 'UI/UX Designing',
      description:
        "I'm a UI/UX designer passionate about crafting intuitive and visually appealing digital experiences. Proficient in Figma, I transform concepts into user-centric designs that enhance usability and engagement. Committed to creating designs that captivate and streamline user interactions. Let's shape the future of user experiences!",
      accent: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <section id="services" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-wider uppercase text-[#1e9fab] dark:text-[#12f7ff] mb-2">
            What I Expert In
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My <span className="text-[#6e57e0] dark:text-[#12f7ff]">Services</span>
          </h2>
          <div className="w-16 h-1 bg-[#6e57e0] dark:bg-[#12f7ff] rounded-full mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="group relative bg-white dark:bg-[#161f30] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/30 hover:border-[#6e57e0] dark:hover:border-[#12f7ff] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#6e57e0]/10 text-[#6e57e0] dark:bg-[#12f7ff]/10 dark:text-[#12f7ff] mb-6 group-hover:scale-110 group-hover:bg-[#6e57e0] group-hover:text-white dark:group-hover:bg-[#12f7ff] dark:group-hover:text-slate-900 transition-all duration-300">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-[#6e57e0] dark:text-[#12f7ff]">
                  <span>Professional Quality Assured</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
