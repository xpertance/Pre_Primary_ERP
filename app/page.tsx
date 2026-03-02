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
  X
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      name: "Vikram Malhotra",
      role: "Principal, EuroKids International",
      content: "Implementing this ERP was the best decision for our campus. It has streamlined our administrative tasks seamlessly and improved our operational efficiency by 40%.",
      rating: 5
    },
    {
      name: "Sneha Kapoor",
      role: "Director, Kangaroo Kids",
      content: "The parent communication portal is fantastic. It has bridged the gap between teachers and parents effectively, ensuring everyone is on the same page regarding child progress.",
      rating: 5
    },
    {
      name: "Rohan Deshmukh",
      role: "Administrator, Podar Jumbo Kids",
      content: "Managing student fees and attendance has never been easier. The automated reports are a lifesaver, allowing us to focus more on education quality.",
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
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Pre-Primary ERP</h1>
                <p className="text-xs text-gray-500">School Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
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
                <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="#benefits" className="text-gray-600 hover:text-gray-900">Benefits</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
                <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
                <Link href="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-center">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-accent via-primary to-primary-dark overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 shadow-sm hover:bg-white/20 transition-colors cursor-default">
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="text-sm font-medium text-white/90">Trusted by 500+ schools worldwide</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                Smart Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">Modern Preschools</span>
              </h1>

              <p className="text-lg lg:text-xl text-indigo-100 mb-10 leading-relaxed max-w-xl">
                Streamline operations, enhance parent communication, and focus on what matters most—child development. All from one powerful, intuitive platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:bg-indigo-50 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all backdrop-blur-sm shadow-sm flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                  </div>
                  Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-white/80 text-sm font-medium">Free for 14 days</span>
                  </div>
                  <div className="text-xs text-indigo-200">No credit card needed</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-blue-300" />
                    <span className="text-white/80 text-sm font-medium">Bank-grade Security</span>
                  </div>
                  <div className="text-xs text-indigo-200">ISO 27001 Certified</div>
                </div>
              </div>
            </div>

            {/* Right Image/Dashboard Preview */}
            <div className="relative mx-auto lg:ml-auto w-full max-w-lg lg:max-w-none">
              <div className="relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-700 ease-out group">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl pointer-events-none" />
                <Image
                  src="/dashboard.png"
                  alt="Pre-Primary ERP Dashboard Interface"
                  width={800}
                  height={600}
                  className="rounded-xl shadow-inner bg-gray-900"
                />

                {/* Floating Card 1: Stats */}
                <div className="hidden sm:flex absolute -top-8 -right-8 bg-white p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex-col gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Revenue</div>
                      <div className="text-lg font-bold text-gray-900">+24%</div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2: Active Users */}
                <div className="hidden sm:flex absolute -bottom-10 -left-10 bg-white p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] items-center gap-4 animate-bounce" style={{ animationDuration: '5s' }}>
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600`}>
                        U{i}
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      +40
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Active Students</div>
                    <div className="text-xs text-green-600 font-medium flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                      Online Now
                    </div>
                  </div>
                </div>
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
              <button className="mt-8 px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 text-lg font-medium">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </button>
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
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Trusted by Leading Institutions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover how our partners are transforming their school management experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group relative">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="mb-8 relative">
                  <span className="text-6xl text-gray-100 absolute -top-4 -left-2 font-serif select-none">"</span>
                  <p className="text-gray-700 leading-relaxed relative z-10 italic">
                    {testimonial.content}
                  </p>
                </div>
                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{testimonial.name}</div>
                    <div className="text-sm text-gray-500 font-medium">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/* <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
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
                className={`rounded-xl p-8 border-2 ${
                  plan.popular 
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
                <button className={`w-full py-3 rounded-lg font-medium transition-colors mb-8 ${
                  plan.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                  Get Started
                </button>
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
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-accent via-primary to-primary-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of schools using Pre-Primary ERP to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium">
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-transparent text-white rounded-lg border-2 border-white hover:bg-white/10 transition-colors text-lg font-medium">
              Schedule Demo
            </button>
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
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your school name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us about your requirements"
                  />
                </div>
                <button className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
                  Send Message
                </button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="text-gray-900">info@preprimaryerp.com</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="text-gray-900">+91 98765 43210</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Address</div>
                    <div className="text-gray-900">Mumbai, Maharashtra, India</div>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  Our support team is available 24/7 to assist you with any questions
                </p>
                <button className="text-primary-dark font-medium flex items-center gap-2">
                  Visit Help Center
                  <ArrowRight className="w-4 h-4" />
                </button>
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
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
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
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Live Demo</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Product Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community Forum</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Webinars & Events</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press & Media</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
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
              {/* Social Icons */}
              {[1, 2, 3, 4].map((i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all hover:-translate-y-1">
                  <Star className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}