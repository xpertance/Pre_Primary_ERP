"use client"
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  ClipboardList,
  Clock,
  Shield,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Star,
  Menu,
  X,
  UploadCloud,
  FileText
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isCareersModalOpen, setIsCareersModalOpen] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const handleCareerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Using FormSubmit AJAX to bypass page reloads & safely attach files to sales@xpertance.in
      const response = await fetch("https://formsubmit.co/ajax/sales@xpertance.in", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Application submitted successfully! We will review and get back to you soon.");
        setResumeName("");
        setIsCareersModalOpen(false);
        form.reset();
      } else {
        alert("Failed to send application. Please try again.");
      }
    } catch (error) {
      alert("Error submitting. Please try later.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingContact(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formsubmit.co/ajax/sales@xpertance.in", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Thank you! Your message has been sent successfully.");
        form.reset();
      } else {
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      alert("Error sending message. Please try later.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  useEffect(() => {
    const sections = ["features", "benefits", "pricing", "testimonials", "contact"];
    const observerOptions = {
      root: null,
      rootMargin: "-80px 0px -40% 0px", // 80px accommodates the fixed navbar
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Find the intersecting entry that is currently active, or the last one intersecting
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Handle Contact section specially when near the bottom of the page
    const handleScroll = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      // If we are within 300px of the bottom of the page, ensure contact is highlighted
      if (scrollBottom >= pageHeight - 300) {
        setActiveSection("contact");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Comprehensive student profiles, enrollment tracking, and parent communication tools",
      color: "bg-pink-500",
      lightBg: "bg-pink-50"
    },
    {
      icon: GraduationCap,
      title: "Teacher Management",
      description: "Manage teaching staff, assign classes, track performance and schedules efficiently",
      color: "bg-purple-500",
      lightBg: "bg-purple-50"
    },
    {
      icon: ClipboardList,
      title: "Class Organization",
      description: "Create and manage classes, sections, and student groups with ease",
      color: "bg-orange-500",
      lightBg: "bg-orange-50"
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description: "Real-time attendance monitoring with automated reports and notifications",
      color: "bg-cyan-500",
      lightBg: "bg-cyan-50"
    },
    {
      icon: DollarSign,
      title: "Fee Management",
      description: "Streamlined fee collection, payment tracking, and financial reporting",
      color: "bg-green-500",
      lightBg: "bg-green-50"
    },
    {
      icon: Clock,
      title: "Timetable Scheduling",
      description: "Create and manage timetables, class schedules, and event planning",
      color: "bg-blue-500",
      lightBg: "bg-blue-50"
    }
  ];

  const benefits = [
    "Reduce administrative workload by 60%",
    "Improve parent-teacher communication",
    "Real-time data access from anywhere",
    "Automated report generation",
    "Secure data management",
    "Mobile-friendly interface"
  ];

  const stats = [
    { number: "500+", label: "Schools Trust Us" },
    { number: "50K+", label: "Students Managed" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Support Available" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Principal, Little Stars Academy",
      content: "Pre-Primary ERP has transformed how we manage our school. The intuitive interface makes it easy for all staff members to use.",
      rating: 5
    },
    {
      name: "Rajesh Kumar",
      role: "Administrator, Sunshine Kindergarten",
      content: "The attendance and fee management features have saved us countless hours. Parent feedback has been overwhelmingly positive.",
      rating: 5
    },
    {
      name: "Anjali Patel",
      role: "Director, Growing Minds School",
      content: "Excellent support team and regular updates. This system grows with our needs and handles everything we require.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "₹4,999",
      period: "per month",
      description: "Perfect for small preschools",
      features: [
        "Up to 100 students",
        "Basic student management",
        "Attendance tracking",
        "Fee management",
        "Email support",
        "Mobile app access"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "₹9,999",
      period: "per month",
      description: "Most popular for growing schools",
      features: [
        "Up to 500 students",
        "All Starter features",
        "Teacher management",
        "Advanced reporting",
        "Parent portal",
        "Priority support",
        "Custom timetables",
        "SMS notifications"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large institutions",
      features: [
        "Unlimited students",
        "All Professional features",
        "Multi-branch support",
        "Custom integrations",
        "Dedicated account manager",
        "On-premise deployment",
        "Training sessions",
        "24/7 phone support"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pre-Primary ERP</h1>
                <p className="text-xs text-gray-500">School Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { id: "features", label: "Features" },
                { id: "benefits", label: "Benefits" },
                { id: "testimonials", label: "Testimonials" },
                { id: "pricing", label: "Pricing" },
                { id: "contact", label: "Contact" }
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`text-sm font-medium transition-all duration-300 relative py-1 group ${activeSection === item.id ? "text-primary scale-105" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-300 ${activeSection === item.id ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-50"
                    }`} />
                </a>
              ))}
              <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                {[
                  { id: "features", label: "Features" },
                  { id: "benefits", label: "Benefits" },
                  { id: "testimonials", label: "Testimonials" },
                  { id: "pricing", label: "Pricing" },
                  { id: "contact", label: "Contact" }
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`text-base font-medium transition-all duration-300 flex items-center gap-2 ${activeSection === item.id ? "text-primary translate-x-2" : "text-gray-600"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {activeSection === item.id && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                    {item.label}
                  </a>
                ))}
                <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-center">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="demo" className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        {/* Subtle background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-50 blur-3xl opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-50 blur-3xl opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-100 mb-8">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-slate-700">Trusted by 500+ schools</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold mb-6 leading-[1.2] tracking-tight text-slate-900">
                Complete School<br />
                Management System for<br />
                Pre-Primary Education
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-500 mb-10 leading-relaxed max-w-md">
                Streamline your preschool operations with our comprehensive ERP system. Manage students, teachers, attendance, fees, and more from one powerful platform.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all hover:-translate-y-0.5 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                  Watch Demo
                </Link>
              </div>
            </div>

            {/* Right — Dashboard Image */}
            <div className="relative mt-10 lg:mt-0">
              {/* Image card */}
              <div className="relative rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-100 overflow-hidden">
                <Image
                  src="/dashboard.png"
                  alt="Pre-Primary ERP Dashboard"
                  width={900}
                  height={620}
                  className="w-full h-auto block"
                  priority
                />
              </div>

              {/* Floating Card — 50K+ Students (top-right, OUTSIDE the image card) */}
              <div
                className="absolute -top-5 -right-5 bg-secondary rounded-2xl px-6 py-5 shadow-2xl flex flex-col items-center justify-center animate-bounce cursor-default z-10"
                style={{ animationDuration: '4s', minWidth: '110px' }}
              >
                <span className="text-2xl font-black text-white leading-none">50K+</span>
                <span className="text-xs font-bold text-white/90 mt-1">Students</span>
              </div>

              {/* Floating Card — 99.9% Uptime (bottom-left, overlapping corner) */}
              <div
                className="absolute -bottom-5 left-8 bg-primary rounded-2xl px-7 py-5 shadow-2xl flex flex-col items-center justify-center animate-bounce cursor-default z-10"
                style={{ animationDuration: '5s', minWidth: '120px' }}
              >
                <span className="text-2xl font-black text-white leading-none">99.9%</span>
                <span className="text-xs font-bold text-white/90 mt-1">Uptime</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your School
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive ERP system includes all the features you need to run your pre-primary school efficiently
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-sky-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Schools Choose Pre-Primary ERP
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join hundreds of schools that have transformed their operations with our intelligent management system
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link href="/login" className="mt-8 px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-lg font-medium inline-flex w-fit">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                <Shield className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Secure & Reliable</h3>
                <p className="text-gray-600">Bank-level security with daily backups</p>
              </div>
              <div className="bg-secondary/10 rounded-xl p-6 border border-secondary/20 mt-8">
                <Zap className="w-10 h-10 text-secondary mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Optimized for speed and performance</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-6 border border-accent/20">
                <BarChart3 className="w-10 h-10 text-accent mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Analytics</h3>
                <p className="text-gray-600">Data-driven insights and reports</p>
              </div>
              <div className="bg-green-50 rounded-xl p-6 border border-green-200 mt-8">
                <Users className="w-10 h-10 text-green-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Easy to Use</h3>
                <p className="text-gray-600">Intuitive interface for everyone</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Loved by School Administrators
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              See what our customers have to say about Pre-Primary ERP
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-gray-700 leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                {/* Author */}
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your school's needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl p-8 border-2 ${plan.popular
                  ? 'border-orange-500 bg-orange-50 relative'
                  : 'border-gray-200 bg-white'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <Link
                  href="/login"
                  className={`w-full py-3 rounded-lg font-medium transition-colors mb-8 block text-center ${plan.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                >
                  Get Started
                </Link>
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of schools using Pre-Primary ERP to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium inline-block text-center whitespace-nowrap">
              Start Free Trial
            </Link>
            <Link href="/login" className="px-8 py-4 bg-transparent text-white rounded-lg border-2 border-white hover:bg-white/10 transition-colors text-lg font-medium inline-block text-center whitespace-nowrap">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-accent/5 via-primary/5 to-primary-dark/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-xl text-gray-600">
              Have questions? We'd love to hear from you
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <form className="space-y-6" onSubmit={handleContactSubmit}>
                {/* Prevent Captcha from FormSubmit when using AJAX */}
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_subject" value="New Inquiry from Pre-Primary ERP Website!" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="Name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="Email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                  <input
                    type="text"
                    name="School Name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your school name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    name="Message"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                    placeholder="Tell us about your requirements"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="w-full flex items-center justify-center py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingContact ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="text-gray-900">sales@xpertance.in</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="text-gray-900">+91 76203 01874</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Address</div>
                    <div className="text-gray-900 leading-relaxed">311, Innonsh Technologies, One Mall (Reliance Shop), Bhondve Vasti, Aundh-Ravet, BRTS Road, Ravet. 412101</div>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  Our support team is available 24/7 to assist you with any questions
                </p>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Pre-Primary ERP</h3>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Empowering the next generation of schools with intelligent, secure, and intuitive management solutions.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Product Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">API Documentation</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Community Forum</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Webinars & Events</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">About Us</a></li>
                <li><button onClick={(e) => { e.preventDefault(); setIsCareersModalOpen(true); }} className="hover:text-white transition-colors cursor-pointer text-left">Careers</button></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer: Legal & Social */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-slate-500">
              <span>© {new Date().getFullYear()} Pre-Primary ERP. All rights reserved.</span>
              <div className="hidden md:block w-1 h-1 bg-slate-700 rounded-full" />
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Security</a>
              </div>
            </div>

            <div className="flex gap-4 text-slate-400">
              {/* No social icons */}
            </div>
          </div>
        </div>
      </footer>

      {/* Careers Modal */}
      {isCareersModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Join Our Team</h3>
                <p className="text-gray-500 text-sm mt-1">We aren't actively hiring, but we'd love to have your profile on file.</p>
              </div>
              <button
                onClick={() => { setIsCareersModalOpen(false); setResumeName(""); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form className="space-y-5" onSubmit={handleCareerSubmit}>
                {/* Prevent Captcha from FormSubmit when using AJAX */}
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_subject" value="New Career Application Submission!" />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="Full Name"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Highest Education</label>
                  <input
                    type="text"
                    name="Education"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. B.Tech in Computer Science"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Key Skills</label>
                  <textarea
                    rows={3}
                    name="Key Skills"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="e.g. React, Node.js, Design, Management..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Resume / CV</label>
                  <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-primary/50 transition-colors cursor-pointer group relative">
                    <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <span className="block text-sm text-gray-600 font-medium">
                      {resumeName ? <span className="text-primary font-bold">{resumeName}</span> : "Click to upload or drag and drop"}
                    </span>
                    <span className="block text-xs text-gray-400 mt-1">PDF, DOCX up to 5MB</span>
                    <input
                      type="file"
                      name="attachment"
                      accept=".pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setResumeName(e.target.files?.[0]?.name || "")}
                      required
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingForm ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}